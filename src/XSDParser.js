import xpath from "xpath";

export default class XSDParser {

    constructor(xsdString) {
        const Dom = require('xmldom').DOMParser
        this.parsedXsd = new Dom().parseFromString(xsdString)
        this.select = xpath.useNamespaces({'xs': 'http://www.w3.org/2001/XMLSchema'})
    }

    getRootElements = () =>
        this.parseElement(this.select(`//xs:element`, this.parsedXsd))
        // this.parseElement(this.select(`/xs:schema/xs:element`, this.parsedXsd))


    getSubElements = (elementName) =>
        this.parseElement(this.select(`//xs:complexType[@name='${elementName}Type']//xs:element`, this.parsedXsd))

    getRequiredAttributeForElement = (elementName) =>
        this.select(`//xs:complexType[contains(name, '${elementName}Type')]/xs:attribute[@use='required']`, this.parsedXsd)
            .map(node => (
                console.log(node)
            ))

    getAttributesForElement = (elementName) =>
        this.parseAttribute(this.select(`//xs:complexType[@name='${elementName}Type']/xs:attribute`, this.parsedXsd))

    parseElement = (element) =>
        element.map(node => {
            const attributes = this.getAttributesForNode(node)
            return {
                label: attributes.name,
                value: attributes.name,
                kind: attributes.type,
            }
        })

    parseAttribute = (attribute) =>
        attribute.map(node => {
            const attributes = this.getAttributesForNode(node)
            const documentation = this.getDocumentationForAttribute(node)
            console.log(documentation)
            return {
                label: attributes.name,
                value: attributes.name,
                kind: attributes.type,
                documentation: documentation[0]
            }
        })

    getAttributesForNode = (node) =>
        this.select('@*', node)
            .reduce((acc, curr) => ({...acc, [curr.name]: curr.value}), {})

    getDocumentationForAttribute = (attribute) =>
        this.select(`xs:annotation/xs:documentation`, attribute)
            .map(documentation => documentation.firstChild ? documentation.firstChild.data : null)
}
