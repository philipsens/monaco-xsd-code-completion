import CodeSuggester from './CodeSuggester'
import { CompletionType } from './models/CompletionType'
import XSDParser from './XSDParser'
import { editor, IPosition, languages, Position } from 'monaco-editor'
import CompletionList = languages.CompletionList
import CompletionItem = languages.CompletionItem
import CompletionItemProvider = languages.CompletionItemProvider
import ITextModel = editor.ITextModel
import ProviderResult = languages.ProviderResult

export default class XSDCodeCompletionProvider {
    private codeSuggester: CodeSuggester

    constructor(xsd: XSDParser) {
        this.codeSuggester = new CodeSuggester(xsd)
    }

    public provider = (): CompletionItemProvider => ({
        triggerCharacters: ['<', ' ', '/'],
        provideCompletionItems: (
            model: ITextModel,
            position: Position,
        ): ProviderResult<CompletionList> => ({
            //TODO: Context?
            suggestions: this.getSuggestions(model, position),
        }),
        // TODO: Resolve?
    })

    private getSuggestions = (model: ITextModel, position: Position): CompletionItem[] => {
        const lastTag = this.getLastTag(model, position)
        const completionType = this.getCompletionType(model, position)

        switch (completionType) {
            case CompletionType.none:
                return this.codeSuggester.elements(lastTag, true)
            case CompletionType.element:
                return this.codeSuggester.elements(lastTag)
            case CompletionType.attribute:
                return this.codeSuggester.attributes(lastTag)
            case CompletionType.incompleteElement:
                return this.codeSuggester.elements(lastTag, false, true)
            case CompletionType.closingElement:
                return this.completeClosingTag(lastTag)
        }
    }

    private getLastTag = (model: ITextModel, position: Position): string => {
        const parentTags = this.getParentTags(model, position)
        const wordAtPosition = this.getWordAtPosition(model, position)
        return wordAtPosition === parentTags[parentTags.length - 1]
            ? parentTags[parentTags.length - 2]
            : parentTags[parentTags.length - 1]
    }

    private getParentTags = (model: ITextModel, position: Position): string[] => {
        const textUntilPosition = this.getTextUntilPosition(model, position)
        const tags = this.getTagsFromText(textUntilPosition)
        const parentTags: string[] = []
        if (tags)
            tags.map((tag) => {
                if (parentTags.includes(tag)) {
                    while (parentTags[parentTags.length - 1] !== tag) {
                        parentTags.pop()
                    }
                    parentTags.pop()
                } else {
                    parentTags.push(tag)
                }
            })
        return parentTags
    }

    private getWordAtPosition = (model: ITextModel, position: Position): string | undefined => {
        const wordAtPosision = model.getWordAtPosition(position)
        if (wordAtPosision !== null) return wordAtPosision.word
    }

    private getTextUntilPosition = (model: ITextModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private getTagsFromText = (text: string): string[] | undefined => {
        const regexForTags = /(?<=<|<\/)[^\s|/>]+(?!.+\/>)/g
        const matches = text.match(regexForTags)
        if (matches) return [...matches]
    }

    private getCompletionType = (model: ITextModel, position: Position): CompletionType => {
        const characterBeforePosition = this.getCharacterBeforePosition(model, position)

        if (characterBeforePosition === '<') return CompletionType.element
        if (characterBeforePosition === ' ') return CompletionType.attribute
        if (characterBeforePosition === '/') return CompletionType.closingElement

        const wordsBeforePosition = this.getWordsBeforePosition(model, position)

        if (this.textContainsAttributes(wordsBeforePosition)) return CompletionType.attribute
        if (this.textContainsTags(wordsBeforePosition)) return CompletionType.incompleteElement

        return CompletionType.none
    }

    private getCharacterBeforePosition = (model: ITextModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column - 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private getWordsBeforePosition = (model: ITextModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private textContainsAttributes = (text: string): boolean =>
        this.getAttributesFromText(text) !== undefined

    private getAttributesFromText = (text: string): string[] | undefined => {
        const regexForAttributes = /(?<=\s)[A-Za-z0-9]+/g
        const matches = text.match(regexForAttributes)
        if (matches) return [...matches]
    }

    private textContainsTags = (text: string): boolean => this.getTagsFromText(text) !== undefined

    private completeClosingTag = (name: string): CompletionItem[] => [
        {
            label: name,
            kind: languages.CompletionItemKind.Property,
            detail: 'Close tag',
            insertText: name,
        },
    ]
}
