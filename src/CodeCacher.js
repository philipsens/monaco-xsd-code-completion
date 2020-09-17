export default class CodeCacher {
    xsd
    elementCollections = []
    attributeCollections = []

    constructor(xsd) {
        this.xsd = xsd
    }

    elements = (parentElement) =>
        typeof parentElement === 'undefined'
            ? this.rootElements()
            : this.subElements(parentElement)

    rootElements = () =>
        typeof this.elementCollections['rootElements'] === 'undefined'
            ? this.getRootElements()
            : this.elementCollections['rootElements']

    getRootElements = () => {
        console.log(`Fetch root elements from XSD`)
        this.elementCollections['rootElements'] = this.xsd.getRootElements()
        return this.elementCollections['rootElements']
    }

    subElements = (parentElement) =>
        typeof this.elementCollections[parentElement] === 'undefined'
            ? this.getSubElements(parentElement)
            : this.elementCollections[parentElement]

    getSubElements = (parentElement) => {
        console.log(`Fetch sub elements for ${parentElement} from XSD`)
        this.elementCollections[parentElement] = this.xsd.getSubElements(parentElement)
        return this.elementCollections[parentElement]
    }

    attributes = (element) => {
        // console.log(this.attributeCollections[element])
        return typeof this.attributeCollections[element] === 'undefined'
            ? this.getAttributes(element)
            : this.attributeCollections[element]
    }

    getAttributes = (element) => {
        console.log(`Fetch attributes for ${element} from XSD`)
        this.attributeCollections[element] = this.xsd.getAttributesForElement(element)
        return this.attributeCollections[element]
    }
}