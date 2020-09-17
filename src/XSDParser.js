import xpath from "xpath";

export default class XSDParser {

    constructor(xsdString) {
        const Dom = require('xmldom').DOMParser
        this.parsedXsd = new Dom().parseFromString(xsdString)
        this.select = xpath.useNamespaces({'xs': 'http://www.w3.org/2001/XMLSchema'})
    }

    getRootElements = () =>
        this.parseElement(this.select(`/xs:schema/xs:element`, this.parsedXsd))

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
                insertText: attributes.name + '${1}></' + attributes.name,
                kind: monaco.languages.CompletionItemKind.Method,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            }
        })

    parseAttribute = (attribute) =>
        attribute.map(node => ({
            attributes: this.getAttributesForNode(node),
            documentation: this.getDocumentationForAttribute(node)
        }))

    getAttributesForNode = (node) =>
        this.select('@*', node)
            .reduce((acc, curr) => ({...acc, [curr.name]: curr.value}), {})

    getDocumentationForAttribute = (attribute) =>
        this.select(`xs:annotation/xs:documentation`, attribute)
            .map(documentation => documentation.firstChild ? documentation.firstChild.data : null)
}
