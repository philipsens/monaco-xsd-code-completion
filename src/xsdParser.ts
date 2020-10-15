import * as xpath from 'xpath'
import { SelectedValue } from 'xpath'
import { DOMParser } from 'xmldom'
import DocumentNode from './models/DocumentNode'

export default class XsdParser {
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

    public getRootElements = (): DocumentNode[] =>
        this.parseElements(
            this.select(`/${this.namespace}:schema/${this.namespace}:element`, this.xsdDom),
        )

    private parseElements = (elements: SelectedValue[]): DocumentNode[] =>
        elements.map(
            (element: SelectedValue): DocumentNode => this.getAttributesForNode(element as Node),
        )

    private getAttributesForNode = (node: Node): any =>
        this.select('@*', node).reduce(
            (acc: any, curr: any): any => ({ ...acc, [curr.name]: curr.value }),
            {},
        )

    public getSubElements = (elementName: string): DocumentNode[] =>
        this.parseElements(
            this.select(
                `//${this.namespace}:complexType[@name='${this.getElementType(elementName)}']//${
                    this.namespace
                }:element`,
                this.xsdDom,
            ),
        )

    private getElementType = (elementName: string): string =>
        this.select(`//${this.namespace}:element[@name='${elementName}']/@type`, this.xsdDom).map(
            (type: any): any => type.value,
        )[0]

    public getAttributesForElement = (elementName: string): DocumentNode[] =>
        this.parseAttributes(
            this.select(
                `//${this.namespace}:complexType[@name='${this.getElementType(elementName)}']/${
                    this.namespace
                }:attribute`,
                this.xsdDom,
            ),
        )

    private parseAttributes = (attributes: SelectedValue[]): DocumentNode[] =>
        attributes.map(
            (attribute: SelectedValue): DocumentNode => ({
                ...this.getAttributesForNode(attribute as Node),
                ...this.getDocumentationForNode(attribute as Node)[0],
            }),
        )

    private getDocumentationForNode = (attribute: Node): any =>
        this.select(
            `${this.namespace}:annotation/${this.namespace}:documentation`,
            attribute,
        ).map((documentation: any): any =>
            documentation.firstChild !== null
                ? { documentation: documentation.firstChild.data }
                : null,
        )
}
