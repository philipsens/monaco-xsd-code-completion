import xsd from './ibisdoc.xsd'
import XSDParser from './XSDParser.js'
import CodeCompleter from "./CodeCompleter";

const ibisdoc = new XSDParser(xsd);

console.log("Parse XSD")
console.log(ibisdoc.parsedXsd)

const input = document.getElementById('input');
const output = document.getElementById('output');

let elements
let currentElement
let lines = 0

const cc = new CodeCompleter(ibisdoc)

input.oninput = () => {
    let outputString = '';

    const inputLine = input.value.split('\n')
    const inputWords = inputLine[inputLine.length - 1].split(' ')

    const firstCharacter = inputWords[0].charAt(0)

    const elementInput = inputWords[0].substring(1, inputWords[0].length)
    const attributeInput = inputWords[inputWords.length - 1]

    if (lines !== inputLine.length) {
        console.log(`There are ${inputLine.length} lines, last time it were ${lines}`)
        lines = inputLine.length
        if (inputLine.length > 1) {
            elements = cc.elements(currentElement)
        } else {
            elements = cc.elements()
        }
    }

    if (inputWords.length > 1) {
        if (currentElement !== elementInput) {
            currentElement = elementInput
        }
        cc.attributes(elementInput).matchName(attributeInput).map(attribute => {
            outputString += JSON.stringify(attribute) + '<br />'
        })
    } else if (firstCharacter === '<') {
        elements.matchName(elementInput).map((element) => {
            outputString += JSON.stringify(element) + '<br />'
        })
    }

    output.innerHTML = outputString;
}