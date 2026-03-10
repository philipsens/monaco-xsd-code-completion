import CodeSuggestionCache from './CodeSuggestionCache'
import TurndownService from 'turndown'
import { IMarkdownString, languages } from 'monaco-editor'
import { DocumentNode, ICompletion } from './types'
import XsdParser from './XsdParser'

export default class CodeSuggester {
    private codeSuggestionCache: CodeSuggestionCache
    private turndownService: TurndownService

    constructor(xsdParser: XsdParser) {
        this.codeSuggestionCache = new CodeSuggestionCache(xsdParser)
        this.turndownService = new TurndownService()
    }

    public elements = (
        parentElement: string,
        namespace: string | undefined,
        withoutTag = false,
        incomplete = false,
    ): ICompletion[] =>
        this.parseElements(
            this.codeSuggestionCache.elements(parentElement),
            namespace,
            withoutTag,
            incomplete,
        )

    public attributes = (element: string, incomplete = false): ICompletion[] =>
        this.parseAttributes(this.codeSuggestionCache.attributes(element), incomplete)

    private parseElements = (
        elements: DocumentNode[],
        namespace: string | undefined,
        withoutTag: boolean,
        incomplete: boolean,
    ): ICompletion[] =>
        elements.flatMap((element: DocumentNode, index: number): ICompletion[] => {
            const rawName = element.ref ?? element.name
            if (!rawName) return []
            const elementName = this.parseElementName(rawName, namespace)
            return [
                {
                    label: elementName,
                    kind: withoutTag
                        ? languages.CompletionItemKind.Snippet
                        : languages.CompletionItemKind.Method,
                    detail: this.parseDetail(element.type),
                    sortText: index.toString(),
                    insertText: this.parseElementInputText(elementName, withoutTag, incomplete),
                    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: this.parseDocumentation(element.documentation),
                },
            ]
        })

    private stripNsPrefix = (name: string): string => {
        const idx = name.indexOf(':')
        return idx !== -1 ? name.substring(idx + 1) : name
    }

    private parseElementName = (name: string, namespace: string | undefined): string => {
        const localName = this.stripNsPrefix(name)
        return namespace ? namespace + ':' + localName : localName
    }

    private parseElementInputText = (
        name: string,
        withoutTag: boolean,
        incomplete: boolean,
    ): string => {
        if (withoutTag) return '<' + name + '${1}>\n\t${2}\n</' + name + '>'
        if (incomplete) return name

        return name + '${1}></' + name
    }

    private parseAttributes = (attributes: DocumentNode[], incomplete: boolean): ICompletion[] =>
        attributes.flatMap((attribute: DocumentNode): ICompletion[] => {
            const attributeName = attribute.ref ?? attribute.name
            if (!attributeName) return []
            return [
                {
                    label: attributeName,
                    kind: languages.CompletionItemKind.Variable,
                    detail: this.parseDetail(attribute.type),
                    insertText: this.parseAttributeInputText(attributeName, incomplete),
                    preselect: this.attributeIsRequired(attribute),
                    insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: this.parseDocumentation(attribute.documentation),
                },
            ]
        })

    private parseDetail = (detail: string | undefined) => {
        if (detail) {
            const [partOne, partTwo] = detail.split(':')
            return partTwo ?? partOne
        }
    }

    private parseDocumentation = (documentation: string | undefined): IMarkdownString => ({
        value: documentation ? this.turndownService.turndown(documentation) : '',
        isTrusted: true,
    })

    private attributeIsRequired = (attribute: DocumentNode) => attribute.use === 'required'

    private parseAttributeInputText = (name: string, incomplete: boolean): string =>
        incomplete ? name : name + '="${1}"'
}
