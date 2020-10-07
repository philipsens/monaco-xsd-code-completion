import CodeSuggester from './CodeSuggester'
import { CompletionType } from './models/CompletionType'
import XSDParser from './XSDParser'
import { editor, IPosition, languages } from 'monaco-editor-core'
import CompletionList = languages.CompletionList
import CompletionItem = languages.CompletionItem
import IModel = editor.IModel

export default class XSDCodeCompletionProvider {
    private codeSuggester: CodeSuggester

    constructor(xsd: XSDParser) {
        this.codeSuggester = new CodeSuggester(xsd)
    }

    public provider = () => ({
        triggerCharacters: ['<', ' ', '/'],
        provideCompletionItems: (model: IModel, position: IPosition): CompletionList => ({
            suggestions: this.getSuggestions(model, position),
        }),
    })

    private getSuggestions = (model: IModel, position: IPosition): CompletionItem[] => {
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

    private getLastTag = (model: IModel, position: IPosition): string => {
        const parentTags = this.getParentTags(model, position)
        const wordAtPosition = this.getWordAtPosition(model, position)
        return wordAtPosition === parentTags[parentTags.length - 1]
            ? parentTags[parentTags.length - 2]
            : parentTags[parentTags.length - 1]
    }

    private getParentTags = (model: IModel, position: IPosition): string[] => {
        const textUntilPosition = this.getTextUntilPosition(model, position)
        const tags = this.getTagsFromText(textUntilPosition)
        //TODO
        const parentTags: string[] = []
        if (tags)
            tags.map((tag) => {
                if (tag in parentTags) {
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

    private getWordAtPosition = (model: IModel, position: IPosition): string => {
        const wordAtPosision = model.getWordAtPosition(position)
        if (wordAtPosision !== null) return wordAtPosision.word
        return ''
    }

    private getTextUntilPosition = (model: IModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private getTagsFromText = (text: string): string[] => {
        const regexForTags = /(?<=<|<\/)[^\s|/>]+(?!.+\/>)/g
        const matches = text.match(regexForTags)
        if (matches) return [...matches]
        return ['']
    }

    private getCompletionType = (model: IModel, position: IPosition): CompletionType => {
        const characterBeforePosition = this.getCharacterBeforePosition(model, position)

        if (characterBeforePosition === '<') return CompletionType.element
        if (characterBeforePosition === ' ') return CompletionType.attribute
        if (characterBeforePosition === '/') return CompletionType.closingElement

        const wordsBeforePosition = this.getWordsBeforePosition(model, position)

        if (this.textContainsAttributes(wordsBeforePosition)) return CompletionType.attribute
        if (this.textContainsTags(wordsBeforePosition)) return CompletionType.incompleteElement

        return CompletionType.none
    }

    private getCharacterBeforePosition = (model: IModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column - 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private getWordsBeforePosition = (model: IModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private textContainsAttributes = (text: string): boolean =>
        typeof this.getAttributesFromText(text) !== 'undefined'

    private getAttributesFromText = (text: string): string[] => {
        const regexForAttributes = /(?<=\s)[A-Za-z0-9]+/g
        const matches = text.match(regexForAttributes)
        if (matches) return [...matches]
        return ['']
    }

    private textContainsTags = (text: string): boolean =>
        typeof this.getTagsFromText(text) !== 'undefined'

    private completeClosingTag = (name: string): CompletionItem[] => [
        {
            label: name,
            kind: languages.CompletionItemKind.Property,
            detail: 'Close tag',
            insertText: name,
        },
    ]
}
