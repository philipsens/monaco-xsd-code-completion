import XsdParser from './XsdParser'
import { DocumentNode, IXsd } from './types'

export default class CodeSuggestionCache {
    private xsd: IXsd
    private xsdParser: XsdParser
    private elementCollections: Map<string, DocumentNode[]>
    private attributeCollections: Map<string, DocumentNode[]>

    constructor(xsd: IXsd) {
        this.xsd = xsd
        this.elementCollections = new Map()
        this.attributeCollections = new Map()
        this.xsdParser = new XsdParser(xsd.value)
    }

    public elements = (parentElement: string): DocumentNode[] =>
        parentElement === undefined ? this.rootElements() : this.subElements(parentElement)

    cacheElementCollection = (element: string, documentElement: DocumentNode[]): DocumentNode[] => {
        this.elementCollections.set(element, documentElement)
        return documentElement
    }

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
        console.log(`Fetch root elements from ${this.xsd.path}`)
        return this.cacheElementCollection('rootElements', this.xsdParser.getRootElements())
    }

    private subElements = (parentElement: string): DocumentNode[] => {
        const subElements = this.elementCollections.get(parentElement)
        if (subElements) return subElements
        return this.getSubElements(parentElement)
    }

    private getSubElements = (parentElement: string): DocumentNode[] => {
        console.log(`Fetch sub elements for ${parentElement} from ${this.xsd.path}`)
        return this.cacheElementCollection(
            parentElement,
            this.xsdParser.getSubElements(parentElement),
        )
    }

    private getAttributes = (element: string): DocumentNode[] => {
        console.log(`Fetch attributes for ${element} from ${this.xsd.path}`)
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
