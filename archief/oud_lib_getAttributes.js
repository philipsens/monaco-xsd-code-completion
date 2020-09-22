import xsd from './ibisdoc.xsd'
import xpath from 'xpath'
import * as _ from 'lodash'

const dom = require('xmldom').DOMParser

const parsedXsd = new dom().parseFromString(xsd)

const select = xpath.useNamespaces({ xs: 'http://www.w3.org/2001/XMLSchema' })
const element = () => select('//xs:element', parsedXsd)

console.log(parsedXsd)
console.log(element())

const input = document.getElementById('input')
const output = document.getElementById('output')

const elementAtributes = (element) => {
    let attributeString = ''
    for (let i = 0; i < element.attributes.length; i++) {
        attributeString += element.attributes[i].value + ' '
    }
    return attributeString
}

input.oninput = () => {
    console.log('Input change')
    let outputString = ''
    element()
        .filter((node) => node.attributes[0].value.includes(input.value))
        .map(
            (result) =>
                (outputString += `${
                    result.attributes[0].value
                } ${elementAtributes(result)}<br />`)
        )
    output.innerHTML = outputString
}
