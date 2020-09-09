import xsd from './ibisdoc.xsd'
import XSDParser from './XSDParser.js'
import CodeCompleter from "./CodeCompleter";

const ibisdoc = new XSDParser(xsd);

console.log("Parse XSD")
console.log(ibisdoc.parsedXsd)

const input = document.getElementById('input');
const output = document.getElementById('output');

/*
Collection
new collection
collection.getmatches
collection.getfirstmatch

of

new CC(ibis)
cc.getAttributesForElement(dfdfd).getMatchingAttributes(ghghg)
 */

let elements
let lastElement
let attributes
let lines = 0
let firstMatch
input.oninput = () => {
    let outputString = '';

    const inputLine = input.value.split('\n')
    const inputWords = inputLine[inputLine.length - 1].split(' ')
    const firstCharacter = inputWords[0].charAt(0)
    const firstWord = inputWords[0].substring(1, inputWords[0].length)
    const lastWord = inputWords[inputWords.length - 1]

    if (lines !== inputLine.length) {
        console.log(`There are ${inputLine.length} lines, last time it were ${lines}`)
        lines = inputLine.length
        if (inputLine.length > 1) {
            console.log(`Fetch sub elements for ${lastElement} from XSD`)
            elements = new CodeCompleter(ibisdoc.getSubElements(lastElement))
        } else {
            console.log(`Fetch root elements from XSD`)
            elements = new CodeCompleter(ibisdoc.getRootElements())
        }
    }

    if (inputWords.length > 1) {
        if (lastElement !== firstWord) {
            lastElement = firstWord
            console.log(`Fetch attributes for ${firstWord} from XSD`)
            attributes = new CodeCompleter(ibisdoc.getAttributesForElement(firstWord))
        }
        attributes.getMatches(lastWord).map(attribute => {
            outputString += JSON.stringify(attribute) + '<br />'
        })
    } else if (firstCharacter === '<') {
        elements.getMatches(firstWord).map((element, index) => {
            if (index === 0) {
                if (firstMatch !== element) {
                    ibisdoc.getRequiredAttributeForElement(element.attributes.name)
                    firstMatch = element
                }
            }
            outputString += JSON.stringify(element) + '<br />'
        })
    }

    output.innerHTML = outputString;
}