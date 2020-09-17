import CodeSuggestionCache from "./CodeSuggestionCache";
import TurndownService from "turndown";

export default class CodeSuggester {
    constructor(xsd) {
        this.codeSuggestionCache = new CodeSuggestionCache(xsd)
        this.turndownService = new TurndownService()
    }

    elements = (parentElement) =>
        this.parseElements(this.codeSuggestionCache.elements(parentElement))

    parseElements = (elements) =>
        elements.map(element => ({
            label: element.name,
            insertText: element.name + '${1}></' + element.name,
            kind: monaco.languages.CompletionItemKind.Method,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }))

    attributes = (parentElement) =>
        this.parseAttributes(this.codeSuggestionCache.attributes(parentElement))

    parseAttributes = (attributes) =>
        attributes.map(attribute => ({
            label: attribute.name,
            insertText: attribute.name + '="${1}"',
            detail: attribute.type.replace('xs:', ''),
            preselect: attribute.use === "required",
            kind: monaco.languages.CompletionItemKind.Variable,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: {
                value: attribute.documentation ? this.turndownService.turndown(attribute.documentation) : '',
                isTrusted: true,
            }
        }))


}