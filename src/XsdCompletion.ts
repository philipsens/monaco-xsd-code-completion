import XsdCollection from './XsdCollection'
import { editor, IPosition, languages, Position } from 'monaco-editor'
import ICompletion from './ICompletion'
import { CompletionType } from './models/CompletionType'
import IStringHash from './IStringHash'
import CompletionItemProvider = languages.CompletionItemProvider
import ITextModel = editor.ITextModel
import CompletionContext = languages.CompletionContext
import ProviderResult = languages.ProviderResult
import CompletionList = languages.CompletionList
import CompletionItem = languages.CompletionItem
import CompletionTriggerKind = languages.CompletionTriggerKind

export default class XsdCompletion {
    private xsdCollection: XsdCollection

    constructor(xsdCollection: XsdCollection) {
        this.xsdCollection = xsdCollection
    }

    public provider = (): CompletionItemProvider => ({
        triggerCharacters: ['<', ' ', '/'],
        provideCompletionItems: (
            model: ITextModel,
            position: Position,
            context: CompletionContext,
        ): ProviderResult<CompletionList> => ({
            suggestions: this.getCompletionItems(model, position, context),
        }),
    })

    private getCompletionItems = (
        model: ITextModel,
        position: Position,
        context: CompletionContext,
    ): CompletionItem[] => {
        console.log('suggestions:')

        const completionType = this.getCompletionType(model, position, context)
        if (completionType == CompletionType.none) return []

        const parentTag = this.getParentTag(model, position)
        const namespaces = this.getXsdNamespaces(model)

        // TODO: Multiple workers for multiple XSD
        // const completions = this.worker.doCompletion(completionType, parentTag, namespaces)
        const completions: ICompletion[] = []

        const wordUntilPosition = model.getWordUntilPosition(position)
        const wordRange = {
            startColumn: wordUntilPosition.startColumn,
            startLineNumber: position.lineNumber,
            endColumn: wordUntilPosition.endColumn,
            endLineNumber: position.lineNumber,
        }

        return completions.map(
            (completion: ICompletion): CompletionItem => ({
                label: completion.name,
                kind: completion.kind,
                detail: completion.type,
                insertText: completion.text,
                preselect: completion.required,
                insertTextRules: completion.insert,
                documentation: completion.documentation,
                range: wordRange,
            }),
        )
    }

    private getCompletionType = (
        model: ITextModel,
        position: Position,
        context: CompletionContext,
    ): CompletionType => {
        const wordsBeforePosition = this.getWordsUntilPosition(model, position)
        if (this.isInsideAttributeValue(wordsBeforePosition)) return CompletionType.none

        switch (context.triggerKind) {
            case CompletionTriggerKind.Invoke:
            case CompletionTriggerKind.TriggerForIncompleteCompletions:
                return this.getCompletionTypeForIncompleteCompletion(wordsBeforePosition)
            case CompletionTriggerKind.TriggerCharacter:
                return this.getCompletionTypeByTriggerCharacter(context.triggerCharacter)
        }
    }

    private getWordsUntilPosition = (model: ITextModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private isInsideAttributeValue = (text: string): boolean => {
        const regexForInsideAttributeValue = /="[^"]+$/
        const matches = text.match(regexForInsideAttributeValue)
        return !!matches
    }

    private getCompletionTypeForIncompleteCompletion = (text: string): CompletionType => {
        if (this.textContainsAttributes(text)) return CompletionType.incompleteAttribute
        if (this.textContainsTags(text)) return CompletionType.incompleteElement
        return CompletionType.snippet
    }

    private textContainsAttributes = (text: string): boolean =>
        this.getAttributesFromText(text) !== undefined

    private getAttributesFromText = (text: string): string[] | undefined =>
        this.getMatchesForRegex(text, /(?<=\s)[A-Za-z0-9]+/g)

    private getMatchesForRegex = (text: string, regex: RegExp): string[] => {
        const matches = text.match(regex)
        if (matches) return [...matches]
        return []
    }

    private textContainsTags = (text: string): boolean => this.getTagsFromText(text) !== undefined

    private getTagsFromText = (text: string): string[] | undefined =>
        this.getMatchesForRegex(text, /(?<=<|<\/)[^?\s|/>]+(?!.+\/>)/g)

    private getCompletionTypeByTriggerCharacter = (
        triggerCharacter: string | undefined,
    ): CompletionType => {
        switch (triggerCharacter) {
            case '<':
                return CompletionType.element
            case ' ':
                return CompletionType.attribute
            case '/':
                return CompletionType.closingElement
        }
        return CompletionType.none
    }

    private getParentTag = (model: ITextModel, position: Position): string | undefined => {
        const textUntilPosition = this.getTextUntilPosition(model, position)
        const unclosedTags = this.getUnclosedTags(textUntilPosition)
        const wordAtPosition = model.getWordAtPosition(position)
        if (wordAtPosition != null)
            // TODO: Is this necessary?
            return wordAtPosition.word === unclosedTags[unclosedTags.length - 1]
                ? unclosedTags[unclosedTags.length - 2]
                : unclosedTags[unclosedTags.length - 1]
    }

    private getTextUntilPosition = (model: ITextModel, position: IPosition): string =>
        model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private getUnclosedTags = (text: string): string[] => {
        const tags = this.getTagsFromText(text)
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

    private getXsdNamespaces = (model: ITextModel) => {
        const text = this.getFullText(model)
        const namespaces = this.getNamespaces(text)
        const noNamespaces = this.getNoNamespaces(text)
        const namespaceSchemaLocations = this.getNamespacesSchemaLocations(text)
        const noNamespaceSchemaLocations = this.getNoNamespacesSchemaLocations(text)
        this.matchNamespacesAndNamespaceSchemaLocations(
            namespaces,
            noNamespaces,
            namespaceSchemaLocations,
            noNamespaceSchemaLocations,
        )
    }

    private getFullText = (model: ITextModel): string =>
        model.getValueInRange(model.getFullModelRange())

    private getNamespaces = (text: string): string[] =>
        this.getMatchesForRegex(text, /(?<=xmlns:)(?!xsi|html)[^:\s|/>]+="[^\s|>]+(?=")/g)
            .map((match) => {
                const part = match.split('="')
                return { [part[0]]: part[1] }
            }).flat(1)

    private getNoNamespaces = (text: string): IStringHash[] =>
        this.getMatchesForRegex(text, /(?<=xmlns=")[^\s|>]+(?=")/g).map((match) => ({
            ['']: match,
        }))

    private getNamespacesSchemaLocations = (text: string): IStringHash[] =>
        this.getMatchesForRegex(text, /(?<=(xsi:schemaLocation=\n?\s*"))[^|>]+(?=")/g)
            .map((match) => {
                const matches = match.split(/\s+/)
                return matches
                    .filter((location, index) => index % 2)
                    .map((location, index) => ({
                        [location]: matches[index * 2],
                    }))
            })
            .flat(1)

    private getNoNamespacesSchemaLocations = (text: string): IStringHash[] =>
        this.getMatchesForRegex(
            text,
            /(?<=(xsi:noNamespaceSchemaLocation=\n?\s*"))[^|>]+(?=")/g,
        ).map((match) => ({
            ['']: match,
        }))

    private matchNamespacesAndNamespaceSchemaLocations = (
        namespaces: IStringHash[],
        noNamespaces: IStringHash[],
        namespaceSchemaLocations: IStringHash[],
        noNamespaceSchemaLocations: IStringHash[],
    ) => {
        console.log([...noNamespaces, ...namespaces])
        console.log(namespaceSchemaLocations)
        console.log(noNamespaceSchemaLocations)


    }
}
