import { editor, IMarkdownString, IRange, languages } from 'monaco-editor'
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

export interface IXsd {
    path: string
    value: string
    namespace?: string
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

export interface XmlDomError {
    message: string
    type: ErrorType
}

export enum ErrorType {
    warning,
    error,
    fetalError,
}

export class DocumentNode {
    public name!: string
    public documentation?: string
    private readonly type?: string
    private readonly use?: string

    get isRequired(): boolean {
        return this.use === 'required'
    }

    get getType(): string {
        return this.type ? this.type.split(':')[1] : ''
    }
}
