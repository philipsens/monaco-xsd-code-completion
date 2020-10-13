import * as xpath from 'xpath'
import { SelectedValue } from 'xpath'
import { DOMParser } from 'xmldom'
import DocumentNode from './models/DocumentNode'

export default class XSDParser {
    private readonly xsdDom: Document
    private readonly select: xpath.XPathSelect
    public readonly namespace: string

    constructor(xsdString: string, namespace = 'xsd') {
        this.xsdDom = new DOMParser().parseFromString(xsdString)
        this.namespace = namespace
        this.select = xpath.useNamespaces({
            [namespace]: 'http://www.w3.org/2001/XMLSchema',
        })
    }

    getRootElements = (): DocumentNode[] =>
        this.parseElements(
            this.select(`/${this.namespace}:schema/${this.namespace}:element`, this.xsdDom),
        )

    getSubElements = (elementName: string): DocumentNode[] =>
        this.parseElements(
            this.select(
                `//${this.namespace}:complexType[@name='${elementName}Type']//${this.namespace}:element`,
                this.xsdDom,
            ),
        )

    getAttributesForElement = (elementName: string): DocumentNode[] =>
        this.parseAttributes(
            this.select(
                `//${this.namespace}:complexType[@name='${elementName}Type']/${this.namespace}:attribute`,
                this.xsdDom,
            ),
        )

    parseElements = (elements: SelectedValue[]): DocumentNode[] =>
        elements.map(
            (element: SelectedValue): DocumentNode => this.getAttributesForNode(element as Node),
        )

    parseAttributes = (attributes: SelectedValue[]): DocumentNode[] =>
        attributes.map(
            (attribute: SelectedValue): DocumentNode => ({
                ...this.getAttributesForNode(attribute as Node),
                ...this.getDocumentationForNode(attribute as Node)[0],
            }),
        )

    getAttributesForNode = (node: Node): any =>
        this.select('@*', node).reduce(
            (acc: {}, curr: any): any => ({ ...acc, [curr.name]: curr.value }),
            {},
        )

    getDocumentationForNode = (attribute: Node): any =>
        this.select(`${this.namespace}:annotation/${this.namespace}:documentation`, attribute).map(
            (documentation: any): any =>
                documentation.firstChild !== null
                    ? { documentation: documentation.firstChild.data }
                    : null,
        )
}
