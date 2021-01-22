import { INamespaceInfo } from './types'
import { XsdWorker } from './XsdWorker'
import { editor } from 'monaco-editor'
import ITextModel = editor.ITextModel
import { XsdManager } from './index'
import { SimpleParser } from './SimpleParser'

export abstract class XsdNamespaces {
    public static getXsdNamespaces = (model: ITextModel | string): Map<string, INamespaceInfo> => {
        const text = typeof model == 'string' ? model : SimpleParser.getFullText(model)
        const namespaces = XsdNamespaces.getNamespaces(text)
        const namespaceSchemaLocations = XsdNamespaces.getNamespacesSchemaLocations(text)
        return XsdNamespaces.matchNamespacesAndNamespaceSchemaLocations(
            namespaces,
            namespaceSchemaLocations,
        )
    }

    private static getNamespaces = (text: string): Map<string, string> => {
        const namespaceMap = new Map()
        XsdNamespaces.getNamespacesFromText(text).forEach((match) => {
            const part = match.split('="')
            namespaceMap.set(part[1], part[0])
        })
        XsdNamespaces.getNoNamespacesFromText(text).forEach((match) => {
            namespaceMap.set(match, '')
        })
        return namespaceMap
    }

    private static getNamespacesFromText = (text: string): string[] =>
        SimpleParser.getMatchesForRegex(text, /(?<=xmlns:)(?!xsi|html)[^:\s|/>]+="[^\s|>]+(?=")/g)

    private static getNoNamespacesFromText = (text: string): string[] =>
        SimpleParser.getMatchesForRegex(text, /(?<=xmlns=")[^\s|>]+(?=")/g)

    private static getNamespacesSchemaLocations = (text: string): Map<string, string> => {
        const namespaceSchemaLocationsMap = new Map()
        XsdNamespaces.getNamespacesSchemaLocationsFromText(text).forEach((match) => {
            const matches = match.split(/\s+/)
            matches.forEach((location, index) => {
                if (index % 2) namespaceSchemaLocationsMap.set(location, matches[index - 1])
            })
        })
        XsdNamespaces.getNoNamespacesSchemaLocationsFromText(text).forEach((match) =>
            namespaceSchemaLocationsMap.set(match, 'file://' + match),
        )
        return namespaceSchemaLocationsMap
    }

    private static getNamespacesSchemaLocationsFromText = (text: string): string[] =>
        SimpleParser.getMatchesForRegex(text, /(?<=(xsi:schemaLocation=\n?\s*"))[^"|>]+(?=")/g)

    private static getNoNamespacesSchemaLocationsFromText = (text: string): string[] =>
        SimpleParser.getMatchesForRegex(
            text,
            /(?<=(xsi:noNamespaceSchemaLocation=\n?\s*"))[^"|>]+(?=")/g,
        )

    private static matchNamespacesAndNamespaceSchemaLocations = (
        namespaces: Map<string, string>,
        namespaceSchemaLocations: Map<string, string>,
    ): Map<string, INamespaceInfo> => {
        const matchedNamespacesAndNamespaceSchemaLocations = new Map()
        for (const [path, uri] of namespaceSchemaLocations.entries()) {
            matchedNamespacesAndNamespaceSchemaLocations.set(uri, {
                prefix: namespaces.get(uri),
                path: path,
            })
        }
        return matchedNamespacesAndNamespaceSchemaLocations
    }

    public static getXsdWorkersForNamespace = (
        namespaces: Map<string, INamespaceInfo>,
        xsdManager: XsdManager,
    ): XsdWorker[] => {
        const xsdWorkers: XsdWorker[] = []
        for (const [namespace, namespaceInfo] of namespaces.entries()) {
            if (xsdManager.has(namespaceInfo.path) || namespace === undefined || namespace === '') {
                const xsdWorker = xsdManager.get(namespaceInfo.path)
                if (xsdWorker) xsdWorkers.push(xsdWorker.withNamespace(namespaceInfo.prefix))
            } else {
                const xsdWorker = xsdManager.getNonStrict(namespaceInfo.path)
                if (xsdWorker) xsdWorkers.push(xsdWorker.withNamespace(namespaceInfo.prefix))
            }
        }
        const xsdWorker = xsdManager.getAlwaysInclude()
        if (xsdWorker && !xsdWorkers.includes(xsdWorker)) xsdWorkers.push(xsdWorker)

        return xsdWorkers
    }
}
