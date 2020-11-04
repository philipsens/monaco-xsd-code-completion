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
import IWordAtPosition = editor.IWordAtPosition

interface INamespaceInfo {
    prefix: string
    path: string
}

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
        const tagBeforePosition = this.getLastTagBeforePosition(model, position)

        let startColumn = wordUntilPosition.startColumn
        // console.log(wordUntilPosition, tagBeforePosition)
        // if (
        //     wordUntilPosition &&
        //     tagBeforePosition &&
        //     wordUntilPosition.word === this.getTagName(tagBeforePosition)
        // ) {
        //     const lengthDifferance = Math.abs(
        //         tagBeforePosition.length - wordUntilPosition.word.length,
        //     )
        //     startColumn = wordUntilPosition.startColumn - lengthDifferance
        // }
        const wordRange = {
            startColumn: startColumn,
            startLineNumber: position.lineNumber,
            endColumn: wordUntilPosition.endColumn,
            endLineNumber: position.lineNumber,
        }

        return completions.map(
            (completion: ICompletion): CompletionItem => {
                return {
                    ...completion,
                    ...{ range: wordRange },
                }
            },
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
        const lastTagBeforePosition = this.getLastTagBeforePosition(model, position)
        const currentTagNamespace = this.getTagNamespace(lastTagBeforePosition)
        const xsdWorkers = this.getXsdWorkersForNamespace(namespaces, currentTagNamespace)
        const parentTagName = this.getTagName(parentTag)

        let completions: ICompletion[] = []
        xsdWorkers.map((xsdWorker: XsdWorker) => {
            completions = [
                ...completions,
                ...xsdWorker.doCompletion(
                    completionType,
                    parentTagName ? parentTagName : parentTag,
                ),
            ]
        })

        return completions
    }

    private getCompletionType = (
        model: ITextModel,
        position: Position,
        context: CompletionContext,
    ): CompletionType => {
        const wordsBeforePosition = this.getWordsBeforePosition(model, position)
        if (this.isInsideAttributeValue(wordsBeforePosition)) return CompletionType.none

        switch (context.triggerKind) {
            case CompletionTriggerKind.Invoke:
                return this.getCompletionTypeAfterInvoke(wordsBeforePosition)
            case CompletionTriggerKind.TriggerForIncompleteCompletions:
                return this.getCompletionTypeForIncompleteCompletion(wordsBeforePosition)
            case CompletionTriggerKind.TriggerCharacter:
                return this.getCompletionTypeByTriggerCharacter(context.triggerCharacter)
        }
    }

    private getCompletionTypeAfterInvoke = (text: string): CompletionType => {
        const lastCharacterBeforePosition = text[text.length - 1]
        const completionTypeByCharacter = this.getCompletionTypeByCharacterBeforePosition(
            lastCharacterBeforePosition,
        )
        if (completionTypeByCharacter) return completionTypeByCharacter
        return this.getCompletionTypeForIncompleteCompletion(text)
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

    private textContainsAttributes = (text: string): boolean => {
        const attributes = this.getAttributesFromText(text)
        return attributes !== undefined && attributes.length > 0
    }

    private getAttributesFromText = (text: string): string[] | undefined =>
        this.getMatchesForRegex(text, /(?<=\s)[A-Za-z0-9]+/g)

    private getMatchesForRegex = (text: string, regex: RegExp): string[] => {
        const matches = text.match(regex)
        if (matches) return [...matches]
        return []
    }

    private textContainsTags = (text: string): boolean => {
        const tags = this.getTagsFromText(text)
        return tags !== undefined && tags.length > 0
    }

    private getTagsFromText = (text: string): string[] | undefined =>
        this.getMatchesForRegex(text, /(?<=<|<\/)[^?\s|/>]+(?!.*\/>)/g)

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

    private getCompletionTypeByCharacterBeforePosition = (
        triggerCharacter: string | undefined,
    ): CompletionType | undefined => {
        switch (triggerCharacter) {
            case '<':
                return CompletionType.incompleteElement
            case ' ':
                return CompletionType.incompleteAttribute
            case '/':
                return CompletionType.closingElement
        }
    }

    private getParentTag = (model: ITextModel, position: Position): string => {
        const textUntilPosition = this.getTextUntilPosition(model, position)
        const unclosedTags = this.getUnclosedTags(textUntilPosition)
        const wordAtPosition = model.getWordAtPosition(position)
        if (this.wordAtPositionIsEqualToLastUnclosedTag(wordAtPosition, unclosedTags))
            return unclosedTags[unclosedTags.length - 2]

        const lastTagBeforePosition = this.getLastTagBeforePosition(model, position)
        const currentTagName = this.getTagName(lastTagBeforePosition)
        if (wordAtPosition && currentTagName && currentTagName === wordAtPosition.word) {
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

    private wordAtPositionIsEqualToLastUnclosedTag = (
        wordAtPosition: IWordAtPosition | null,
        unclosedTags: string[],
    ): boolean =>
        wordAtPosition !== null && wordAtPosition.word === unclosedTags[unclosedTags.length - 1]

    private getTagName = (tag: string | undefined): string | undefined => {
        const currentTagParts = this.getTagParts(tag)
        if (currentTagParts) return currentTagParts[1]
    }

    private getTagParts = (tag: string | undefined): string[] | undefined => {
        if (tag) {
            const tagParts = tag.split(':')
            if (tagParts.length > 1) return tagParts
        }
    }

    private getLastTagBeforePosition = (
        model: ITextModel,
        position: Position,
    ): string | undefined => {
        const wordsBeforePosition = this.getWordsBeforePosition(model, position)
        const tagsBeforePosition = this.getTagsFromText(wordsBeforePosition)
        if (tagsBeforePosition && tagsBeforePosition.length > 0)
            return tagsBeforePosition[tagsBeforePosition.length - 1]
    }

    private getWordsBeforePosition = (model: ITextModel, position: Position): string =>
        model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        })

    private getClosingElementCompletion = (element: string): ICompletion[] => [
        {
            label: element,
            kind: CompletionItemKind.Property,
            detail: 'Close tag',
            insertText: element,
            documentation: `Closes the unclosed ${element} tag in this file.`,
        },
    ]

    private getXsdNamespaces = (model: ITextModel): Map<string, INamespaceInfo> => {
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
            namespaceMap.set(match, '')
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
            namespaceSchemaLocationsMap.set(match, 'file://' + match),
        )
        return namespaceSchemaLocationsMap
    }

    private matchNamespacesAndNamespaceSchemaLocations = (
        namespaces: Map<string, string>,
        namespaceSchemaLocations: Map<string, string>,
    ): Map<string, INamespaceInfo> => {
        const matchedNamespacesAndNamespaceSchemaLocations = new Map()
        for (const [path, uri] of namespaceSchemaLocations.entries()) {
            matchedNamespacesAndNamespaceSchemaLocations.set(uri, {
                prefix: namespaces.get(uri),
                path: path,
            })
        }
        return matchedNamespacesAndNamespaceSchemaLocations
    }

    private getTagNamespace = (tag: string | undefined): string | undefined => {
        const currentTagParts = this.getTagParts(tag)
        if (currentTagParts) return currentTagParts[0]
    }

    private getXsdWorkersForNamespace = (
        namespaces: Map<string, INamespaceInfo>,
        namespace: string | undefined,
    ): XsdWorker[] => {
        const xsdWorkers = []
        // if (namespace) {
        //     const namespaceInfo = namespaces.get(namespace)
        //     if (namespaceInfo) {
        //         const xsdWorker = this.xsdManager.get(namespaceInfo.path)
        //         if (xsdWorker) xsdWorkers.push(xsdWorker.withNamespace(namespace))
        //     }
        // } else {
        for (const [namespace, namespaceInfo] of namespaces.entries()) {
            if (
                this.xsdManager.has(namespaceInfo.path) ||
                namespace === undefined ||
                namespace === ''
            ) {
                const xsdWorker = this.xsdManager.get(namespaceInfo.path)
                if (xsdWorker) xsdWorkers.push(xsdWorker.withNamespace(namespaceInfo.prefix))
            }
        }
        // }
        return xsdWorkers
    }
}
