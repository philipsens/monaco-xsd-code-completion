import * as xpath from 'xpath'
import { SelectedValue } from 'xpath'
import { DOMParser } from 'xmldom'
import { DocumentNode, IXsd } from './types'

export default class XsdParser {
    private readonly xsd: IXsd
    private readonly namespace: string
    private readonly xsdDom: Document
    private readonly select: xpath.XPathSelect

    constructor(xsd: IXsd) {
        this.xsd = xsd
        this.xsdDom = new DOMParser().parseFromString(this.xsd.value)
        this.namespace = this.xsd.namespace ?? 'xsd'
        this.select = xpath.useNamespaces({
            [this.namespace]: 'http://www.w3.org/2001/XMLSchema',
        })
    }

    public getRootElements = (): DocumentNode[] =>
        this.parseElements(
            this.select(`/${this.namespace}:schema/${this.namespace}:element`, this.xsdDom),
        )

    public getSubElements = (elementName: string): DocumentNode[] => {
        let elements = this.parseElements(
            this.select(
                `//${this.namespace}:complexType[@name='${this.getElementType(elementName)}']//${
                    this.namespace
                }:element`,
                this.xsdDom,
            ),
        )

        let groupElements = this.parseElements(
            this.select(
                `//${this.namespace}:complexType[@name='${this.getElementType(elementName)}']//${
                    this.namespace
                }:group`,
                this.xsdDom,
            ),
        )

        groupElements.forEach((groupElement: DocumentNode) => {
            elements = elements.concat(this.getElementsFromGroup(groupElement))
        })

        let anyElement = this.parseElements(
            this.select(
                `//${this.namespace}:complexType[@name='${this.getElementType(elementName)}']//${
                    this.namespace
                }:any`,
                this.xsdDom,
            ),
        )
        if (anyElement.length) {
            const rootElements = this.getRootElements()
            rootElements.forEach((rootElement: DocumentNode) => {
                elements.push(rootElement)
            })
        }
        return elements
    }

    public getElementsFromGroup = (groupElement: DocumentNode): DocumentNode[] => {
        let elements = this.parseElements(
            this.select(
                `//${this.namespace}:group[@name='${groupElement.ref}']//${this.namespace}:element`,
                this.xsdDom,
            ),
        )
        let groupElements = this.parseElements(
            this.select(
                `//${this.namespace}:group[@name='${groupElement.ref}']//${this.namespace}:group`,
                this.xsdDom,
            ),
        )
        groupElements.forEach((groupElement: DocumentNode) => {
            elements = elements.concat(this.getElementsFromGroup(groupElement))
        })
        return elements
    }

    public getFirstSubElements = (elementName: string, withAttributes: boolean): DocumentNode[] => {
        const elements: SelectedValue[][] = []

        const complexType = this.getComplexType(elementName)

        if (!complexType) {
            return []
        }

        const rootElements = this.getElementsInRootOfNode(complexType)
        if (rootElements.length > 0) elements.push(rootElements)

        const choices = this.getFirstChoiceElementInNode(complexType)
        if (choices.length > 0) elements.push(choices.flat())

        const sequences = this.getSequencesInNode(complexType)

        if (sequences.length > 0) {
            const sequenceElements = this.getElementsInSequences(sequences)
            if (sequenceElements.length > 0) elements.push(sequenceElements.flat())

            const sequenceChoices = this.getFirstChoiceElementInSequences(sequences)
            if (sequenceChoices) elements.push(sequenceChoices.flat())
        }

        let parsedElements = this.parseElements(elements.flat())

        if (withAttributes) parsedElements = this.addRequiredAttributesToElements(parsedElements)

        return parsedElements
    }

    private getComplexType = (name: string): Node =>
        this.select(
            `//${this.namespace}:complexType[@name='${this.getElementType(name)}']`,
            this.xsdDom,
        )[0] as Node

    private getElementsInRootOfNode = (node: Node): SelectedValue[] =>
        this.select(`${this.namespace}:element`, node)

    private getFirstChoiceElementInNode = (node: Node): SelectedValue[] =>
        this.select(`${this.namespace}:choice/${this.namespace}:element[1]`, node)

    private getSequencesInNode = (node: Node): SelectedValue[] =>
        this.select(`${this.namespace}:sequence`, node)

    private getElementsInSequences = (sequences: SelectedValue[]) =>
        sequences.map((sequence) => this.select(`${this.namespace}:element`, sequence as Node))

    private getFirstChoiceElementInSequences = (sequences: SelectedValue[]) =>
        sequences.map((sequence) => this.getFirstChoiceElementInNode(sequence as Node)).flat()

    private addRequiredAttributesToElements = (elements: DocumentNode[]): DocumentNode[] =>
        elements.map((element) => {
            const requiredAttribute = this.parseAttributes(
                this.select(
                    `//${this.namespace}:complexType[@name='${this.getElementType(
                        element.name,
                    )}']/${this.namespace}:attribute[@use='required']`,
                    this.xsdDom,
                ),
            )
            if (requiredAttribute) element['requiredAttribute'] = requiredAttribute
            return element
        })

    public getAttributesForElement = (elementName: string): DocumentNode[] => {
        let attributes = this.parseAttributes(
            this.select(
                `//${this.namespace}:complexType[@name='${this.getElementType(elementName)}']/${
                    this.namespace
                }:attribute`,
                this.xsdDom,
            ),
        )
        let attributeGroups = this.parseAttributes(
            this.select(
                `//${this.namespace}:complexType[@name='${this.getElementType(elementName)}']/${
                    this.namespace
                }:attributeGroup`,
                this.xsdDom,
            ),
        )
        attributeGroups.forEach((attributeGroup: DocumentNode) => {
            attributes = attributes.concat(this.getAttributesFromAttributeGroup(attributeGroup))
        })
        return attributes
    }

    public getAttributesFromAttributeGroup = (attributeGroup: DocumentNode): DocumentNode[] => {
        let attributes = this.parseAttributes(
            this.select(
                `//${this.namespace}:attributeGroup[@name='${attributeGroup.ref}']/${
                    this.namespace
                }:attribute`,
                this.xsdDom,
            ),
        )
        let attributeGroups = this.parseAttributes(
            this.select(
                `//${this.namespace}:attributeGroup[@name='${attributeGroup.ref}']/${
                    this.namespace
                }:attributeGroup`,
                this.xsdDom,
            ),
        )
        attributeGroups.forEach((attributeGroup: DocumentNode) => {
            attributes = attributes.concat(this.getAttributesFromAttributeGroup(attributeGroup))
        })
        return attributes
    }

    private parseElements = (elements: SelectedValue[]): DocumentNode[] =>
        elements.map(
            (element: SelectedValue): DocumentNode => ({
                ...this.getAttributesForNode(element as Node),
                ...this.getDocumentationForNode(element as Node),
            }),
        )

    private getAttributesForNode = (node: Node): any =>
        this.select('@*', node).reduce(
            (acc: any, curr: any): any => ({ ...acc, [curr.name]: curr.value }),
            {},
        )

    private getElementType = (elementName: string): string => {
        let elementType = this.select(`//${this.namespace}:element[@name='${elementName}']/@type`, this.xsdDom)[0] as any
        if (elementType) return elementType.value
        return (this.select(`//${this.namespace}:element[@name='${elementName}']/${this.namespace}:complexType/${this.namespace}:complexContent/${this.namespace}:extension/@base`, this.xsdDom)[0] as any)?.value
    }


    private parseAttributes = (attributes: SelectedValue[]): DocumentNode[] =>
        attributes.map(
            (attribute: SelectedValue): DocumentNode => ({
                ...this.getAttributesForNode(attribute as Node),
                ...this.getDocumentationForNode(attribute as Node),
            }),
        )

    private getDocumentationForNode = (attribute: Node): any => {
        const documentationString = this.select(
            `${this.namespace}:annotation/${this.namespace}:documentation`,
            attribute,
        )
            .map((documentation: any): string => documentation.firstChild ? documentation.firstChild.data : '')
            .join('<br/><hr/><br/>')
        return {
            documentation: `${documentationString}<br/>Source: ${this.xsd.path}`,
        }
    }
}
