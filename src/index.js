import xsd from './ibisdoc.xsd'
import XSDParser from './XSDParser.js'
import CodeCacher from "./CodeCacher";
import * as monaco from 'monaco-editor';

const ibisdoc = new XSDParser(xsd);
const cc = new CodeCacher(ibisdoc)

const xsdCompletionProvider = (monaco) => ({
    triggerCharacters: ['<', ' '],

    provideCompletionItems: (model, position) => {
        const parentTags = getParentTags(model, position)
        const lastTag = parentTags[parentTags.length - 1]

        console.log(`Character before position: "${getCharacterBeforePosition(model, position)}". Last tag: "${lastTag}"`)

        const suggestions = getCharacterBeforePosition(model, position) === ' '
            ? cc.attributes(lastTag)
            : cc.elements(lastTag)
        return {
            suggestions: suggestions
        };
    }
})

const getParentTags = (model, position) => {
    const regexForTags = /(?<=<|<\/)[A-Za-z0-9]+/g
    const matches = getTextUntilPosition(model, position).match(regexForTags)

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