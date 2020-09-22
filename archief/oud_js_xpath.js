import xml2js from 'xml2js'
import xpath from 'xml2js-xpath'
import xsd from '../src/ibisdoc.xsd'

let parsedXsd

xml2js.parseString(xsd, (err, result) => {
    parsedXsd = result
})

const matches = xpath.find(parsedXsd, '//xs:complexType').map((i) => i.$.name)

console.log(parsedXsd)
console.log(matches)

const input = document.getElementById('input')
const output = document.getElementById('output')

input.oninput = () => {
    let outputString
    matches
        .filter((match) => match.includes(input.value))
        .map((result) => (outputString += result + '<br />'))
    output.innerHTML = outputString
}
