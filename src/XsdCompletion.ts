import XsdManager from './XsdManager'
import { editor, IPosition, languages, Position } from 'monaco-editor'
import ICompletion from './ICompletion'
import { CompletionType } from './CompletionType'
import { XsdWorker } from './XsdWorker'
import CompletionItemProvider = languages.CompletionItemProvider
import ITextModel = editor.ITextModel
import CompletionContext = languages.CompletionContext
import ProviderResult = languages.ProviderResult
import CompletionList = languages.CompletionList
import CompletionItem = languages.CompletionItem
import CompletionTriggerKind = languages.CompletionTriggerKind
import CompletionItemKind = languages.CompletionItemKind

export default class XsdCompletion {
    private xsdManager: XsdManager

    constructor(xsdCollection: XsdManager) {
        this.xsdManager = xsdCollection
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
        const completions: ICompletion[] = this.getCompletions(model, position, context)

        const wordUntilPosition = model.getWordUntilPosition(position)
        const wordRange = {
            startColumn: wordUntilPosition.startColumn,
            startLineNumber: position.lineNumber,
            endColumn: wordUntilPosition.endColumn,
            endLineNumber: position.lineNumber,
        }

        return completions.map(
            (completion: ICompletion): CompletionItem => ({
                ...completion,
                ...{ range: wordRange },
            }),
        )
    }

    private getCompletions = (
        model: ITextModel,
        position: Position,
        context: CompletionContext,
    ): ICompletion[] | [] => {
        const completionType = this.getCompletionType(model, position, context)
        if (completionType == CompletionType.none) return []

        const parentTag = this.getParentTag(model, position)
        if (completionType == CompletionType.closingElement)
            return this.getClosingElementCompletion(parentTag)

        const namespaces = this.getXsdNamespaces(model)
        const parentNamespace = this.getNamespaceFromTag(parentTag)
        const xsdWorkers = this.getXsdWorkersForNamespace(namespaces, parentNamespace)

        let completions: ICompletion[] = []
        xsdWorkers.map((xsdWorker: XsdWorker) => {
            completions = [
                ...completions,
                ...xsdWorker.doCompletion(completionType, parentTag, parentNamespace),
            ]
        })

        return completions
    }

    private getCompletionType = (
        model: ITextModel,
        position: Position,
        context: CompletionContext,
    ): CompletionType => {
        const wordsBeforePosition = model.getLineContent(position.lineNumber)
        if (this.isInsideAttributeValue(wordsBeforePosition)) return CompletionType.none

        switch (context.triggerKind) {
            case CompletionTriggerKind.Invoke:
            case CompletionTriggerKind.TriggerForIncompleteCompletions:
                return this.getCompletionTypeForIncompleteCompletion(wordsBeforePosition)
            case CompletionTriggerKind.TriggerCharacter:
                return this.getCompletionTypeByTriggerCharacter(context.triggerCharacter)
        }
    }

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

    private getParentTag = (model: ITextModel, position: Position): string => {
        const textUntilPosition = this.getTextUntilPosition(model, position)
        const unclosedTags = this.getUnclosedTags(textUntilPosition)
        const wordAtPosition = model.getWordAtPosition(position)
        if (wordAtPosition && wordAtPosition.word === unclosedTags[unclosedTags.length - 1])
            return unclosedTags[unclosedTags.length - 2]

        const lineContent = model.getLineContent(position.lineNumber)
        const tagsInLine = this.getTagsFromText(lineContent)
        if (tagsInLine && tagsInLine.length > 0) {
            const lastTagInLine = tagsInLine[tagsInLine.length - 1]
            const lastTagInlineWithoutNamespace = lastTagInLine.split(':')[1]
            if (
                wordAtPosition &&
                lastTagInlineWithoutNamespace &&
                lastTagInlineWithoutNamespace === wordAtPosition.word
            )
                return unclosedTags[unclosedTags.length - 2]
        }
        return unclosedTags[unclosedTags.length - 1]
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

    private getClosingElementCompletion = (element: string): ICompletion[] => [
        {
            label: element,
            kind: CompletionItemKind.Property,
            detail: 'Close tag',
            insertText: element,
            documentation: `Closes the unclosed ${element} tag in this file.`,
        },
    ]

    private getNamespaceFromTag = (tag: string): string | undefined => {
        const parts = tag?.split(':')
        if (parts && parts.length > 1) return parts[0]
    }

    private getXsdNamespaces = (model: ITextModel): Map<string, string> => {
        const text = this.getFullText(model)
        const namespaces = this.getNamespaces(text)
        const namespaceSchemaLocations = this.getNamespacesSchemaLocations(text)
        return this.matchNamespacesAndNamespaceSchemaLocations(namespaces, namespaceSchemaLocations)
    }

    private getFullText = (model: ITextModel): string =>
        model.getValueInRange(model.getFullModelRange())

    private getNamespaces = (text: string): Map<string, string> => {
        const regexForNamespaces = /(?<=xmlns:)(?!xsi|html)[^:\s|/>]+="[^\s|>]+(?=")/g
        const regexForNoNamespaces = /(?<=xmlns=")[^\s|>]+(?=")/g
        const namespaceMap = new Map()
        this.getMatchesForRegex(text, regexForNamespaces).forEach((match) => {
            const part = match.split('="')
            namespaceMap.set(part[1], part[0])
        })
        this.getMatchesForRegex(text, regexForNoNamespaces).forEach((match) => {
            namespaceMap.set(match, match)
        })
        return namespaceMap
    }

    private getNamespacesSchemaLocations = (text: string): Map<string, string> => {
        const regexForNamespacesSchemaLocations = /(?<=(xsi:schemaLocation=\n?\s*"))[^"|>]+(?=")/g
        const regexForNoNamespacesSchemaLocations = /(?<=(xsi:noNamespaceSchemaLocation=\n?\s*"))[^"|>]+(?=")/g
        const namespaceSchemaLocationsMap = new Map()
        this.getMatchesForRegex(text, regexForNamespacesSchemaLocations).forEach((match) => {
            const matches = match.split(/\s+/)
            matches.forEach((location, index) => {
                if (index % 2) namespaceSchemaLocationsMap.set(location, matches[index - 1])
            })
        })
        this.getMatchesForRegex(text, regexForNoNamespacesSchemaLocations).forEach((match) =>
            namespaceSchemaLocationsMap.set(match, match),
        )
        return namespaceSchemaLocationsMap
    }

    private matchNamespacesAndNamespaceSchemaLocations = (
        namespaces: Map<string, string>,
        namespaceSchemaLocations: Map<string, string>,
    ): Map<string, string> => {
        const matchedNamespacesAndNamespaceSchemaLocations = new Map()
        for (const [key, value] of namespaceSchemaLocations.entries()) {
            matchedNamespacesAndNamespaceSchemaLocations.set(namespaces.get(value), key)
        }
        return matchedNamespacesAndNamespaceSchemaLocations
    }

    private getXsdWorkersForNamespace = (
        namespaces: Map<string, string>,
        namespace: string | undefined,
    ): XsdWorker[] => {
        const xsdWorkers = []
        if (namespace) {
            const path = namespaces.get(namespace)
            if (path) {
                const xsdWorker = this.xsdManager.get(path)
                if (xsdWorker) xsdWorkers.push(xsdWorker)
            }
        } else {
            for (const [namespace, namespaceLocation] of namespaces.entries()) {
                if (
                    this.xsdManager.has(namespaceLocation) ||
                    namespace === undefined ||
                    namespace === ''
                ) {
                    const xsdWorker = this.xsdManager.get(namespaceLocation)
                    if (xsdWorker) xsdWorkers.push(xsdWorker)
                }
            }
        }
        return xsdWorkers
    }
}
