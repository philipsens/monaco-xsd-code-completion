import CodeSuggester from "./CodeSuggester";

export default class XSDCodeCompletionProvider {
    constructor(xsd) {
        this.codeSuggester = new CodeSuggester(xsd)
    }

    provider = () => ({
        triggerCharacters: ['<', ' '],
        provideCompletionItems: (model, position) => ({
            suggestions: this.getSuggestions(model, position)
        })
    })

    getSuggestions = (model, position) => {
        const parentTags = this.getParentTags(model, position)
        const lastTag = parentTags[parentTags.length - 1]

        const characterBeforePosition = this.getCharacterBeforePosition(model, position)

        console.log(`Character before position: "${characterBeforePosition}". Last tag: "${lastTag}"`)

        // TODO: Create getCompletionType and remove characterBeforePosition
        return characterBeforePosition === '<'
            ? this.codeSuggester.elements(lastTag)
            : characterBeforePosition === ' '
            ? this.codeSuggester.attributes(lastTag)
            : [] // TODO: Also suggest without brackets
    }

    getParentTags = (model, position) => {
        const regexForTags = /(?<=<|<\/)[A-Za-z0-9]+/g
        const matches = this.getTextUntilPosition(model, position).match(regexForTags)
        const tags = [...matches ? matches : []]

        const parentTags = []
        tags.map(tag => {
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

    getTextUntilPosition = (model, position) =>
        model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        })

    getCharacterBeforePosition = (model, position) =>
        model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column - 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        })
}
