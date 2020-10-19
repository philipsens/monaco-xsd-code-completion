import { IRange, languages } from 'monaco-editor-core'
import CompletionItemKind = languages.CompletionItemKind
import CompletionItemInsertTextRule = languages.CompletionItemInsertTextRule

export default interface ICompletion {
    name: string
    kind: CompletionItemKind
    type: string
    text: string
    required: boolean
    insert: CompletionItemInsertTextRule
    documentation: string
    range?: IRange
}
