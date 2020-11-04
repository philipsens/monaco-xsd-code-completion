import XsdParser from './XsdParser'
import DocumentNode from './DocumentNode'
import IXsd from './IXsd'

export default class CodeSuggestionCache {
    private xsd: IXsd
    private xsdParser: XsdParser
    private nodeMap: string[] = []
    private elementCollections: DocumentNode[][] = []
    private attributeCollections: DocumentNode[][] = []

    constructor(xsd: IXsd) {
        this.xsd = xsd
        this.xsdParser = new XsdParser(xsd.value)
    }

    public elements = (parentElement: string): DocumentNode[] =>
        parentElement === undefined ? this.rootElements() : this.subElements(parentElement)

    setElementCollection = (element: string, documentElement: DocumentNode[]): DocumentNode[] => {
        this.nodeMap.push(element)
        this.elementCollections[this.getIndexForNode(element)] = documentElement
        return this.getElementCollection(element)
    }

    public attributes = (element: string): DocumentNode[] =>
        this.getAttributeCollection(element) || this.getAttributes(element)

    private rootElements = (): DocumentNode[] =>
        this.getElementCollection('rootElements') || this.getRootElements()

    private getElementCollection = (element: string): DocumentNode[] =>
        this.elementCollections[this.getIndexForNode(element)]

    private getIndexForNode = (node: string): number => this.nodeMap.indexOf(node)

    private getRootElements = (): DocumentNode[] => {
        console.log(`Fetch root elements from ${this.xsd.path}`)
        return this.setElementCollection('rootElements', this.xsdParser.getRootElements())
    }

    private subElements = (parentElement: string): DocumentNode[] =>
        this.getElementCollection(parentElement) || this.getSubElements(parentElement)

    private getSubElements = (parentElement: string): DocumentNode[] => {
        console.log(`Fetch sub elements for ${parentElement} from ${this.xsd.path}`)
        return this.setElementCollection(
            parentElement,
            this.xsdParser.getSubElements(parentElement),
        )
    }

    private getAttributeCollection = (element: string): DocumentNode[] =>
        this.attributeCollections[this.getIndexForNode(element)]

    private getAttributes = (element: string): DocumentNode[] => {
        console.log(`Fetch attributes for ${element} from ${this.xsd.path}`)
        return this.setAttributeCollection(element, this.xsdParser.getAttributesForElement(element))
    }

    private setAttributeCollection = (
        element: string,
        documentAttribute: DocumentNode[],
    ): DocumentNode[] => {
        this.nodeMap.push(element)
        this.attributeCollections[this.getIndexForNode(element)] = documentAttribute
        return this.getAttributeCollection(element)
    }
}
