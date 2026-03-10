import { DOMParser } from '@xmldom/xmldom'
import { DocumentNode, IXsd } from './types'

const XSD_NS = 'http://www.w3.org/2001/XMLSchema'

const CONTAINER_NODES = new Set(['sequence', 'all', 'complexContent', 'extension', 'restriction'])

export default class XsdParser {
    private readonly xsd: IXsd
    private readonly xsdDoc: Document

    // these indexes are built once at construction time for fast lookups during code completions
    private readonly complexTypeMap = new Map<string, Element>()
    private readonly attributeGroupMap = new Map<string, Element>()
    private readonly groupMap = new Map<string, Element>()
    private readonly elementTypeMap = new Map<string, string>()

    constructor(xsd: IXsd) {
        this.xsd = xsd
        this.xsdDoc = new DOMParser().parseFromString(xsd.value) as unknown as Document
        this.buildIndexes()
    }

    private buildIndexes(): void {
        this.indexNamedNodes('complexType', this.complexTypeMap)
        this.indexNamedNodes('attributeGroup', this.attributeGroupMap)
        this.indexNamedNodes('group', this.groupMap)
        this.indexAllElements()
    }

    /**
     * Populates a map with all xs:<localName> nodes that have a @name attribute.
     */
    private indexNamedNodes(localName: string, map: Map<string, Element>): void {
        const nodes = this.xsdDoc.getElementsByTagNameNS(XSD_NS, localName)
        for (let i = 0; i < nodes.length; i++) {
            const name = nodes[i].getAttribute('name')
            if (name) map.set(name, nodes[i] as unknown as Element)
        }
    }

    /**
     * Indexes every xs:element so we can look up its content model by name.
     */
    private indexAllElements(): void {
        const elements = this.xsdDoc.getElementsByTagNameNS(XSD_NS, 'element')
        for (let i = 0; i < elements.length; i++) {
            this.indexElement(elements[i] as unknown as Element)
        }
    }

    /**
     * For each xs:element, determines its type and stores it in elementTypeMap:
     * If @type is present, use that.
     * Else if it has an extension base, use that.
     * Else if it has an inline complexType, store that complexType under a synthetic name and use that.
     */
    private indexElement(element: Element): void {
        const name = element.getAttribute('name')
        if (!name) return

        const typeAttribute = element.getAttribute('type')
        if (typeAttribute) {
            this.elementTypeMap.set(name, this.stripNsPrefix(typeAttribute))
            return
        }

        const extensionBase = this.readExtensionBase(element)
        if (extensionBase) {
            this.elementTypeMap.set(name, this.stripNsPrefix(extensionBase))
            return
        }

        const inlineComplexType = this.firstChildElement(element, 'complexType')
        if (inlineComplexType && !this.elementTypeMap.has(name)) {
            const key = `__inline__${name}`
            this.complexTypeMap.set(key, inlineComplexType)
            this.elementTypeMap.set(name, key)
        }
    }

    private stripNsPrefix(value: string): string {
        const idx = value.indexOf(':')
        return idx !== -1 ? value.substring(idx + 1) : value
    }

    /**
     * Returns all direct element children of the given node.
     */
    private elementChildren(node: Element): Element[] {
        const result: Element[] = []
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i] as Element
            if (child.nodeType === 1) result.push(child)
        }
        return result
    }

    /**
     * Returns the first direct child with the given local name and @name attribute, or null.
     */
    private firstChildElement(parent: Element, localName: string): Element | null {
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = parent.childNodes[i] as Element
            if (child.nodeType === 1 && child.localName === localName) return child
        }

        return null
    }

    /**
     * Returns the first direct child with the given local name and @name attribute, or null.
     */
    private childrenByLocalName(parent: Element, localName: string): Element[] {
        return this.elementChildren(parent).filter((el) => el.localName === localName)
    }

    /**
     * Reads the base type from an xs:element with an inline complexType that extends another type:
     */
    private readExtensionBase(element: Element): string | null {
        const ct = this.firstChildElement(element, 'complexType')
        const cc = ct && this.firstChildElement(ct, 'complexContent')
        const ext = cc && this.firstChildElement(cc, 'extension')
        return ext ? ext.getAttribute('base') : null
    }

    /**
     * Given an element name, looks up its complex type by checking:
     * @param elementName the name of the element to look up
     */
    private complexTypeForElement(elementName: string): Element | undefined {
        const typeName = this.elementTypeMap.get(elementName)
        return typeName ? this.complexTypeMap.get(typeName) : undefined
    }

    /**
     * Recursively walks the content model of a complexType, collecting xs:element nodes. Follows group refs and extension/restriction chains.
     */
    private collectElements(
        node: Element,
        result: Element[],
        visited: Set<string>,
        firstOnly: boolean,
    ): void {
        for (const child of this.elementChildren(node)) {
            const localName = child.localName
            if (localName === 'element') {
                result.push(child)
            } else if (localName === 'choice') {
                firstOnly
                    ? this.collectFirstChoice(child, result, visited)
                    : this.collectElements(child, result, visited, false)
            } else if (CONTAINER_NODES.has(localName)) {
                this.collectElements(child, result, visited, firstOnly)
            } else if (localName === 'group') {
                this.followGroupRef(child, result, visited, firstOnly)
            }
        }
    }

    /**
     * For an xs:choice, collects only the first element from each branch. If a branch is a group ref, follows it and collects the first element from that group.
     */
    private collectFirstChoice(choice: Element, result: Element[], visited: Set<string>): void {
        const firstElement = this.firstChildElement(choice, 'element')
        if (firstElement) {
            result.push(firstElement)
            return
        }

        const firstGroup = this.firstChildElement(choice, 'group')
        if (firstGroup) this.followGroupRef(firstGroup, result, visited, true)
    }

    /**
     * Looks up a named xs:group and walks its content. Skips already-visited groups to prevent cycles.
     */
    private followGroupRef(
        groupNode: Element,
        result: Element[],
        visited: Set<string>,
        firstOnly: boolean,
    ): void {
        const ref = groupNode.getAttribute('ref')
        if (!ref) return

        const name = this.stripNsPrefix(ref)
        if (visited.has(name)) return

        visited.add(name)

        const group = this.groupMap.get(name)
        if (group) this.collectElements(group, result, visited, firstOnly)
    }

    /**
     * Collects xs:attribute nodes, following extension/restriction chains and attributeGroup refs.
     */
    private collectAttributes(node: Element): Element[] {
        const result: Element[] = []
        for (const child of this.elementChildren(node)) {
            const localName = child.localName
            if (localName === 'attribute') {
                result.push(child)
            } else if (['complexContent', 'extension', 'restriction'].includes(localName)) {
                result.push(...this.collectAttributes(child))
            } else if (localName === 'attributeGroup') {
                const ref = child.getAttribute('ref')
                if (ref) result.push(...this.attributesFromGroup(this.stripNsPrefix(ref)))
            }
        }
        return result
    }

    private attributesFromGroup(groupName: string): Element[] {
        const group = this.attributeGroupMap.get(groupName)
        return group ? this.collectAttributes(group) : []
    }

    private parseElement(element: Element): DocumentNode {
        return {
            ...this.readNodeAttributes(element),
            ...this.readDocumentation(element),
        } as DocumentNode
    }

    private readNodeAttributes(element: Element): Record<string, string> {
        const result: Record<string, string> = {}
        for (let i = 0; i < element.attributes.length; i++) {
            const attribute = element.attributes[i]
            if (attribute.name === 'xmlns' || attribute.name.startsWith('xmlns:')) continue
            result[attribute.localName ?? attribute.name] = attribute.value
        }
        return result
    }

    private readDocumentation(element: Element): { documentation: string } {
        const docs: string[] = []
        for (const child of this.elementChildren(element)) {
            if (child.localName !== 'annotation') continue
            const docNodes = child.getElementsByTagNameNS(XSD_NS, 'documentation')
            for (let i = 0; i < docNodes.length; i++) {
                const el = docNodes[i] as any
                const text: string = el.textContent ?? el.firstChild?.data ?? ''
                if (text.trim()) docs.push(text.trim())
            }
        }
        return { documentation: docs.join('<br/><hr/><br/>') + `<br/>Source: ${this.xsd.path}` }
    }

    private withRequiredAttributes(elements: DocumentNode[]): DocumentNode[] {
        return elements.map((element) => {
            const name = element.name ?? element.ref
            const complexType = name ? this.complexTypeForElement(name) : undefined
            if (!complexType) return element

            const required = this.collectAttributes(complexType)
                .filter((el) => el.getAttribute('use') === 'required')
                .map((el) => this.parseElement(el))

            if (required.length > 0) element.requiredAttribute = required
            return element
        })
    }

    public getRootElements(): DocumentNode[] {
        return this.childrenByLocalName(
            this.xsdDoc.documentElement as unknown as Element,
            'element',
        ).map((el) => this.parseElement(el))
    }

    public getSubElements(elementName: string): DocumentNode[] {
        const complexType = this.complexTypeForElement(elementName)
        if (!complexType) return []

        const collected: Element[] = []
        this.collectElements(complexType, collected, new Set(), false)

        const elements = collected.map((el) => this.parseElement(el))

        if (complexType.getElementsByTagNameNS(XSD_NS, 'any').length > 0) {
            return elements.concat(this.getRootElements())
        }

        return elements
    }

    /**
     * For template generation: takes all elements from sequences, first from choices.
     */
    public getFirstSubElements(elementName: string, withAttributes: boolean): DocumentNode[] {
        const complexType = this.complexTypeForElement(elementName)
        if (!complexType) return []

        const cc = this.firstChildElement(complexType, 'complexContent')
        const ext =
            cc &&
            (this.firstChildElement(cc, 'extension') ?? this.firstChildElement(cc, 'restriction'))
        const traversalRoot = ext || complexType

        const collected: Element[] = []
        this.collectElements(traversalRoot, collected, new Set(), true)

        const elements = collected.map((el) => this.parseElement(el))
        return withAttributes ? this.withRequiredAttributes(elements) : elements
    }

    public getAttributesForElement(elementName: string): DocumentNode[] {
        const complexType = this.complexTypeForElement(elementName)
        if (!complexType) return []
        return this.collectAttributes(complexType).map((el) => this.parseElement(el))
    }

    public getElementsFromGroup(groupElement: DocumentNode): DocumentNode[] {
        const group = this.groupMap.get(groupElement.ref!)
        if (!group) return []
        const collected: Element[] = []
        this.collectElements(group, collected, new Set([groupElement.ref!]), false)
        return collected.map((el) => this.parseElement(el))
    }

    public getAttributesFromAttributeGroup(attributeGroup: DocumentNode): DocumentNode[] {
        return this.attributesFromGroup(attributeGroup.ref!).map((el) => this.parseElement(el))
    }
}
