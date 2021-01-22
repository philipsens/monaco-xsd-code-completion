import XsdParser from './XsdParser'
import { DocumentNode } from './types'

export default class CodeSuggestionCache {
    private xsdParser: XsdParser
    private elementCollections: Map<string, DocumentNode[]>
    private attributeCollections: Map<string, DocumentNode[]>

    constructor(xsdParser: XsdParser) {
        this.xsdParser = xsdParser
        this.elementCollections = new Map()
        this.attributeCollections = new Map()
    }

    public elements = (parentElement: string): DocumentNode[] =>
        parentElement === undefined ? this.rootElements() : this.subElements(parentElement)

    public attributes = (element: string): DocumentNode[] => {
        const attributes = this.attributeCollections.get(element)
        if (attributes) return attributes
        return this.getAttributes(element)
    }

    private rootElements = (): DocumentNode[] => {
        const elements = this.elementCollections.get('rootElements')
        if (elements) return elements
        return this.getRootElements()
    }

    private getRootElements = (): DocumentNode[] => {
        return this.setElementCollection('rootElements', this.xsdParser.getRootElements())
    }

    private setElementCollection = (
        element: string,
        documentElement: DocumentNode[],
    ): DocumentNode[] => {
        this.elementCollections.set(element, documentElement)
        return documentElement
    }

    private subElements = (parentElement: string): DocumentNode[] => {
        const subElements = this.elementCollections.get(parentElement)
        if (subElements) return subElements
        return this.getSubElements(parentElement)
    }

    private getSubElements = (parentElement: string): DocumentNode[] => {
        return this.setElementCollection(
            parentElement,
            this.xsdParser.getSubElements(parentElement),
        )
    }

    private getAttributes = (element: string): DocumentNode[] => {
        return this.setAttributeCollection(element, this.xsdParser.getAttributesForElement(element))
    }

    private setAttributeCollection = (
        element: string,
        documentAttribute: DocumentNode[],
    ): DocumentNode[] => {
        this.attributeCollections.set(element, documentAttribute)
        return documentAttribute
    }
}
