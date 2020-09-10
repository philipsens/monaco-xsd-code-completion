import xsd from './ibisdoc.xsd'
import XSDParser from './XSDParser.js'
import CodeCompleter from "./CodeCompleter";
import * as monaco from 'monaco-editor';


const ibisdoc = new XSDParser(xsd);
const cc = new CodeCompleter(ibisdoc)


const xsdCompletionProvider = (monaco) => ({
    triggerCharacters: ['<'],

    provideCompletionItems: (model, position) => {
        // TODO: Check if element, subelement
        const textUntilPosition = model.getValueInRange({startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column});
        const word = model.getWordUntilPosition(position);
        const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };
        const match = cc.elements()
        const tags = textUntilPosition.split('<')
        const lastTag = tags[tags.length -1]
        console.log(lastTag)
        return {
            suggestions: match
        };
    }
})

const xsdAttributeCompletionProvider = (monaco) => ({
    triggerCharacters: [' '],

    provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column});
        const tags = textUntilPosition.split('<')
        const lastTag = tags[tags.length -1].trim()
        const attributes = cc.attributes(lastTag)
        return {
            suggestions: attributes
        };
    }
})

monaco.languages.registerCompletionItemProvider('xml', xsdCompletionProvider(monaco))
monaco.languages.registerCompletionItemProvider('xml', xsdAttributeCompletionProvider(monaco))

monaco.editor.create(document.getElementById('container'), {
    value: [
        '<hoi>'
    ].join('\n'),
    language: 'xml'
});


console.log("Parse XSD")
console.log(ibisdoc.parsedXsd)

// const input = document.getElementById('input');
// const output = document.getElementById('output');

let elements
let currentElement
let lines = 0


// input.oninput = () => {
//     let outputString = '';
//
//     const inputLine = input.value.split('\n')
//     const inputWords = inputLine[inputLine.length - 1].split(' ')
//
//     const firstCharacter = inputWords[0].charAt(0)
//
//     const elementInput = inputWords[0].substring(1, inputWords[0].length)
//     const attributeInput = inputWords[inputWords.length - 1]
//
//     if (lines !== inputLine.length) {
//         console.log(`There are ${inputLine.length} lines, last time it were ${lines}`)
//         lines = inputLine.length
//         if (inputLine.length > 1) {
//             elements = cc.elements(currentElement)
//         } else {
//             elements = cc.elements()
//         }
//     }
//
//     if (inputWords.length > 1) {
//         if (currentElement !== elementInput) {
//             currentElement = elementInput
//         }
//         cc.attributes(elementInput).matchName(attributeInput).map(attribute => {
//             outputString += JSON.stringify(attribute) + '<br />'
//         })
//     } else if (firstCharacter === '<') {
//         elements.matchName(elementInput).map((element) => {
//             outputString += JSON.stringify(element) + '<br />'
//         })
//     }
//
//     output.innerHTML = outputString;
// }