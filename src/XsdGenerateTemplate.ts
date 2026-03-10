import XsdManager from './XsdManager'
import { editor } from 'monaco-editor'
import { SimpleParser } from './SimpleParser'
import { DOMParser } from '@xmldom/xmldom'
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
            const [documentElementNamespace, documentElementTag] =
                SimpleParser.splitNamespaceAndTag(documentElementName)

            const element: DocumentNode[] = [{ name: documentElementTag }]
            const elements = this.getFirstSubElements(element, xsdWorkers, level, withAttributes)

            const rootChildren = elements[0]?.elements
            if (!rootChildren) return

            const newXml = this.appendChildsToElement(
                rootChildren,
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
            const elementName = element.name ?? element.ref
            if (!elementName) return
            xsdWorkers.forEach((xsdWorker: XsdWorker) => {
                let subElements = xsdWorker.getFirstSubElements(elementName, withAttributes)

                if (subElements.length > 0) {
                    if (--levels > 0) {
                        subElements = this.getFirstSubElements(
                            subElements,
                            [xsdWorker],
                            levels,
                            withAttributes,
                        )
                    }
                    element.elements = subElements
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
            const childName = child.name ?? child.ref
            if (!childName) return

            let node = document.createElement(
                documentNamespace ? `${documentNamespace}:${childName}` : childName,
            )

            if (child.requiredAttribute) {
                child.requiredAttribute.forEach((requiredAttribute) => {
                    const attrName = requiredAttribute.name ?? requiredAttribute.ref
                    if (attrName) node.setAttribute(attrName, '')
                })
            }

            node.appendChild(document.createTextNode(''))

            if (child.elements) {
                node.appendChild(document.createTextNode('\n'))
                node = this.appendChildsToElement(child.elements, node, document, documentNamespace)
            }

            element.appendChild(node)
            element.appendChild(document.createTextNode('\n'))
        })
        return element
    }
}
