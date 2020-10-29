import CodeSuggestionCache from './CodeSuggestionCache'
import DocumentNode from './DocumentNode'
import TurndownService from 'turndown'
import { IMarkdownString, languages } from 'monaco-editor'
import IXsd from './IXsd'
import ICompletion from './ICompletion'

export default class CodeSuggester {
    private codeSuggestionCache: CodeSuggestionCache
    private turndownService: TurndownService

    constructor(xsd: IXsd) {
        this.codeSuggestionCache = new CodeSuggestionCache(xsd)
        this.turndownService = new TurndownService()
    }

    public elements = (
        parentElement: string,
        withoutTag = false,
        incomplete = false,
    ): ICompletion[] =>
        this.parseElements(this.codeSuggestionCache.elements(parentElement), withoutTag, incomplete)

    public attributes = (element: string, incomplete = false): ICompletion[] =>
        this.parseAttributes(this.codeSuggestionCache.attributes(element), incomplete)

    private parseElements = (
        elements: DocumentNode[],
        withoutTag: boolean,
        incomplete: boolean,
    ): ICompletion[] =>
        elements.map(
            (element: DocumentNode, index: number): ICompletion => ({
                label: element.name,
                kind: withoutTag
                    ? languages.CompletionItemKind.Snippet
                    : languages.CompletionItemKind.Method,
                detail: this.getElementDetail(withoutTag),
                /**
                 * A human-readable string that represents a doc-comment.
                 */
                // TODO: documentation
                // TODO: SimpleType
                sortText: index.toString(),
                insertText: this.parseElementInputText(element.name, withoutTag, incomplete),
                insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            }),
        )

    private parseElementInputText = (
        name: string,
        withoutTag: boolean,
        incomplete: boolean,
    ): string => {
        if (withoutTag) return '<' + name + '${1}>\n\t${2}\n</' + name + '>'
        if (incomplete) return name

        return name + '${1}></' + name
    }

    private getElementDetail = (withoutTag: boolean): string =>
        withoutTag ? `Insert as snippet` : ''

    private parseAttributes = (attributes: DocumentNode[], incomplete: boolean): ICompletion[] =>
        attributes.map(
            (attribute: DocumentNode): ICompletion => ({
                label: attribute.name,
                kind: languages.CompletionItemKind.Variable,
                detail: attribute.getType,
                insertText: this.parseAttributeInputText(attribute.name, incomplete),
                preselect: attribute.isRequired,
                insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: this.parseAttributeDocumentation(attribute.documentation),
            }),
        )

    private parseAttributeDocumentation = (documentation: string | undefined): IMarkdownString => ({
        value: documentation ? this.turndownService.turndown(documentation) : '',
        isTrusted: true,
    })

    private parseAttributeInputText = (name: string, incomplete: boolean): string =>
        incomplete ? name : name + '="${1}"'
}
