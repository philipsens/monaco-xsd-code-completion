import xsd from './ibisdoc.xsd'
import xpath from 'xpath'

const dom = require('xmldom').DOMParser

const parsedXsd = new dom().parseFromString(xsd)

const select = xpath.useNamespaces({ xs: 'http://www.w3.org/2001/XMLSchema' })
const element = () => select('/xs:schema/xs:element/@name', parsedXsd)
// const complexType = (type) => select('/xs:schema/xs:complexType[@name="'+type+'Type"]/xs:sequence/xs:element/@name', parsedXsd)
const complexType = (type) =>
    select(
        '/xs:schema/xs:complexType[@name=/xs:schema/xs:element[@name="' +
            type +
            '"]/@type]/xs:sequence/xs:element/@name',
        parsedXsd
    )
const complexTypeChoice = (type) =>
    select(
        '/xs:schema/xs:complexType[@name="' +
            type +
            'Type"]/xs:sequence/xs:choice/xs:element/@name',
        parsedXsd
    )

console.log(parsedXsd)
console.log(element().map((node) => node.nodeValue))

const input = document.getElementById('input')
const input2 = document.getElementById('input2')
const input3 = document.getElementById('input3')
const output = document.getElementById('output')

input.oninput = () => {
    console.log('Input change')
    output.innerHTML = ''
    let outputString
    element()
        .filter((node) => node.nodeValue.includes(input.value))
        .map((result) => (outputString += result.nodeValue + '<br />'))
    output.innerHTML = outputString
}

input2.oninput = () => {
    console.log('Input change')
    output.innerHTML = ''
    let outputString
    complexType(input.value)
        .filter((node) => node.nodeValue.includes(input2.value))
        .map((result) => (outputString += result.nodeValue + '<br />'))
    output.innerHTML = outputString
}

input3.oninput = () => {
    console.log('Input change')
    output.innerHTML = ''
    let outputString
    complexTypeChoice(input2.value)
        .filter((node) => node.nodeValue.includes(input3.value))
        .map((result) => (outputString += result.nodeValue + '<br />'))
    output.innerHTML = outputString
}
