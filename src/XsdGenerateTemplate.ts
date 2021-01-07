import XsdManager from './XsdManager'
import { editor } from 'monaco-editor'
import { SimpleParser } from './SimpleParser'
import { DOMParser } from 'xmldom'
import { XsdNamespaces } from './XsdNamespaces'
import { DocumentNode } from './types'
import { XsdWorker } from './XsdWorker'
import ITextModel = editor.ITextModel

export default class xsdGenerateTemplate {
    private xsdManager: XsdManager
    private domParser: DOMParser

    constructor(xsdManager: XsdManager) {
        this.xsdManager = xsdManager
        this.domParser = new DOMParser()
    }

    public getTemplate = (
        model: ITextModel | null,
        level: number,
        withAttributes: boolean,
    ): string | undefined => {
        const xml = model ? SimpleParser.getFullText(model) : undefined

        if (xml) {
            const parsedXml = this.domParser.parseFromString(xml)

            const xsdNamespaces = XsdNamespaces.getXsdNamespaces(xml)
            const xsdWorkers = XsdNamespaces.getXsdWorkersForNamespace(
                xsdNamespaces,
                this.xsdManager,
            )

            const documentElementName = parsedXml.documentElement.nodeName
            const [
                documentElementNamespace,
                documentElementTag,
            ] = SimpleParser.splitNamespaceAndTag(documentElementName)

            const element: DocumentNode[] = [{ name: documentElementTag }]
            const elements = this.getFirstSubElements(element, xsdWorkers, level, withAttributes)

            const newXml = this.appendChildsToElement(
                elements[0]['elements'],
                parsedXml.documentElement,
                parsedXml,
                documentElementNamespace,
            )

            return newXml.toString()
        }
    }

    private getFirstSubElements = (
        elements: DocumentNode[],
        xsdWorkers: XsdWorker[],
        levels: number,
        withAttributes: boolean,
    ): DocumentNode[] => {
        elements.forEach((element) => {
            xsdWorkers.forEach((xsdWorker: XsdWorker) => {
                let subElements = xsdWorker.getFirstSubElements(element.name, withAttributes)

                if (subElements.length > 0) {
                    if (--levels > 0) {
                        subElements = this.getFirstSubElements(
                            subElements,
                            [xsdWorker],
                            levels,
                            withAttributes,
                        )
                    }
                    element['elements'] = subElements
                }
            })
        })
        return elements
    }

    private appendChildsToElement = (
        childs: DocumentNode[],
        element: HTMLElement,
        document: Document,
        documentNamespace: string | undefined,
    ): HTMLElement => {
        childs.forEach((child) => {
            let node = document.createElement(
                documentNamespace ? `${documentNamespace}:${child.name}` : child.name,
            )
            if (child['requiredAttribute'])
                child['requiredAttribute'].map((requiredAttribute) =>
                    node.setAttribute(requiredAttribute.name, ''),
                )
            node.appendChild(document.createTextNode(''))
            if (child['elements']) {
                node.appendChild(document.createTextNode('\n'))
                node = this.appendChildsToElement(
                    child['elements'],
                    node,
                    document,
                    documentNamespace,
                )
            }
            element.appendChild(node)
            element.appendChild(document.createTextNode('\n'))
        })
        return element
    }
}
