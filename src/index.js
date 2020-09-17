import xsd from './ibisdoc.xsd'
import XSDParser from './XSDParser.js'
import CodeCacher from "./CodeCacher";
import * as monaco from 'monaco-editor';
import TurndownService from "turndown";


const turndownService = new TurndownService()
const ibisdoc = new XSDParser(xsd);
const cc = new CodeCacher(ibisdoc)

const xsdCompletionProvider = (monaco) => ({
    triggerCharacters: ['<', ' '],

    provideCompletionItems: (model, position) => {
        const parentTags = getParentTags(model, position)
        const lastTag = parentTags[parentTags.length - 1]

        console.log(`Character before position: "${getCharacterBeforePosition(model, position)}". Last tag: "${lastTag}"`)

        const characterBeforePosition = getCharacterBeforePosition(model, position)

        const suggestions = characterBeforePosition === '<'
            ? cc.elements(lastTag)
            : characterBeforePosition === ' '
                ? parseAttributes(cc.attributes(lastTag))
                : cc.elements(lastTag)

        console.log(suggestions)
        return {
            suggestions: suggestions
        };
    }
})

const parseAttributes = (attributes) =>
    attributes.map(attribute => ({
        label: attribute.attributes.name,
        insertText: attribute.attributes.name + '="${1}"',
        detail: attribute.attributes.type.replace('xs:', ''),
        preselect: attribute.attributes.use === "required",
        kind: monaco.languages.CompletionItemKind.Variable,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
            value: attribute.documentation[0] ? turndownService.turndown(attribute.documentation[0]) : '',
            isTrusted: true,
        }
    }))

const getParentTags = (model, position) => {
    const regexForTags = /(?<=<|<\/)[A-Za-z0-9]+/g
    const matches = getTextUntilPosition(model, position).match(regexForTags)

    const tags = [...matches ? matches : []]
    console.log(tags)
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
    console.log(parentTags)
    return parentTags
}

const getTextUntilPosition = (model, position) =>
    model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    })

const getCharacterBeforePosition = (model, position) =>
    model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column - 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    })

monaco.languages.registerCompletionItemProvider('xml', xsdCompletionProvider(monaco))

monaco.editor.create(document.getElementById('container'), {
    value: [
        '<Module\n' +
        '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
        '  xsi:noNamespaceSchemaLocation="./ibisdoc.xsd">\n' +
        '  <Adapter name="Example1Adapter">\n' +
        '\t\t<Receiver name="Example1Receiver">\n' +
        '\t\t\t<JavaListener name="Example1" serviceName="Example1"/>\n' +
        '\t\t</Receiver>\n' +
        '\t\t<Pipeline firstPipe="Example">\n' +
        '\t\t\t<FixedResultPipe name="Example" returnString="Hello World1">\n' +
        '\t\t\t\t<Forward name="success" path="EXIT"/>\n' +
        '\t\t\t</FixedResultPipe>\n' +
        '\t\t\t<Exit path="EXIT" state="success"/>\n' +
        '\t\t</Pipeline>\n' +
        '\t</Adapter>\n' +
        '</Module>'
    ].join('\n'),
    language: 'xml'
});