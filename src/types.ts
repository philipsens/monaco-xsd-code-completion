import { editor, IMarkdownString, IPosition, IRange, languages } from 'monaco-editor'
import CompletionItemKind = languages.CompletionItemKind
import CompletionItemInsertTextRule = languages.CompletionItemInsertTextRule
import CompletionItemLabel = languages.CompletionItemLabel
import CompletionItemTag = languages.CompletionItemTag
import Command = languages.Command

/**
 * A completion item represents a text snippet that is
 * proposed to complete text that is being typed.
 */
export interface ICompletion {
    /**
     * The label of this completion item. By default
     * this is also the text that is inserted when selecting
     * this completion.
     */
    label: string | CompletionItemLabel
    /**
     * The kind of this completion item. Based on the kind
     * an icon is chosen by the editor.
     */
    kind: CompletionItemKind
    /**
     * A modifier to the `kind` which affect how the item
     * is rendered, e.g. Deprecated is rendered with a strikeout
     */
    tags?: ReadonlyArray<CompletionItemTag>
    /**
     * A human-readable string with additional information
     * about this item, like type or symbol information.
     */
    detail?: string
    /**
     * A human-readable string that represents a doc-comment.
     */
    documentation?: string | IMarkdownString
    /**
     * A string that should be used when comparing this item
     * with other items. When `falsy` the [label](#CompletionItem.label)
     * is used.
     */
    sortText?: string
    /**
     * A string that should be used when filtering a set of
     * completion items. When `falsy` the [label](#CompletionItem.label)
     * is used.
     */
    filterText?: string
    /**
     * Select this item when showing. *Note* that only one completion item can be selected and
     * that the editor decides which item that is. The rule is that the *first* item of those
     * that match best is selected.
     */
    preselect?: boolean
    /**
     * A string or snippet that should be inserted in a document when selecting
     * this completion.
     * is used.
     */
    insertText: string
    /**
     * Addition rules (as bitmask) that should be applied when inserting
     * this completion.
     */
    insertTextRules?: CompletionItemInsertTextRule
    /**
     * A range of text that should be replaced by this completion item.
     *
     * Defaults to a range from the start of the [current word](#TextDocument.getWordRangeAtPosition) to the
     * current position.
     *
     * *Note:* The range must be a [single line](#Range.isSingleLine) and it must
     * [contain](#Range.contains) the position at which completion has been [requested](#CompletionItemProvider.provideCompletionItems).
     */
    range?:
        | IRange
        | {
              insert: IRange
              replace: IRange
          }
    /**
     * An optional set of characters that when pressed while this completion is active will accept it first and
     * then type that character. *Note* that all commit characters should have `length=1` and that superfluous
     * characters will be ignored.
     */
    commitCharacters?: string[]
    /**
     * An optional array of additional text edits that are applied when
     * selecting this completion. Edits must not overlap with the main edit
     * nor with themselves.
     */
    additionalTextEdits?: editor.ISingleEditOperation[]
    /**
     * A command that should be run upon acceptance of this item.
     */
    command?: Command
}

export interface INamespaceInfo {
    prefix: string
    path: string
}

export interface IXsd {
    path: string
    value: string
    namespace?: string
    nonStrictPath?: boolean
    alwaysInclude?: boolean
}

export enum CompletionType {
    none,
    element,
    attribute,
    incompleteElement,
    closingElement,
    snippet,
    incompleteAttribute,
}

export class XmlDomError {
    public message!: string
    public type!: ErrorType

    constructor(message: string, type: ErrorType) {
        this.message = message
        this.type = type
    }

    get errorTypeString(): string {
        switch (this.type) {
            case ErrorType.warning:
                return '**Warning**'
            case ErrorType.error:
                return '**Error**'
            case ErrorType.fetalError:
                return '**Fatal error**'
        }
    }

    get classNames(): string {
        switch (this.type) {
            case ErrorType.warning:
                return 'xml-lint xml-lint--warning'
            case ErrorType.error:
                return 'xml-lint xml-lint--error'
            case ErrorType.fetalError:
                return 'xml-lint xml-lint--fetal'
        }
    }

    get errorMessage(): string {
        return this.message.split(/[\t\n]/g)[1] ?? this.message
    }

    get position(): IPosition {
        const columnMatch = this.message.match(/(?<=col:)[0-9]+/g)
        const lineNumberMatch = this.message.match(/(?<=line:)[0-9]+/g)

        const column = parseInt((columnMatch ?? 0)[0]) + 1
        const lineNumber = parseInt((lineNumberMatch ?? 0)[0])

        return { column: column, lineNumber: lineNumber }
    }
}

export enum ErrorType {
    warning,
    error,
    fetalError,
}

export interface DocumentNode {
    name: string
    documentation?: string
    type?: string
    use?: string
}
