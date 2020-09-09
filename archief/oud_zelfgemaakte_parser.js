import xsd from '../src/ibisdoc.xsd'

const matchElements = /<xs:element[^]*?>/g;
const matchEscapeCharacter = /\"/g;
const matchElementAttributes = /[^\s]*?=[^]*?(?=\s)/g;

const elements = Array.from(xsd.matchAll(matchElements))
    .map(element => element[0].replaceAll(matchEscapeCharacter, ''))
    .map(element => Array.from(element.matchAll(matchElementAttributes))
        .map(attributes => attributes[0])
        .map(attribute => attribute.split('='))
        .map(part => ({[part[0]]: part[1]}))
    ).map((outer) => outer.reduce((acc, curr) => ({...acc, ...curr}), {}));

// const elements = [...xsd.matchAll(matchElements)]
//     .map(([element]) => [...element.replaceAll(matchEscapeCharacter, '').matchAll(matchElementAttributes)])
//     .map(([attribute]) => attribute[0].split('='))
//     .map(part => ({[part[0]]: part[1]}))
//     .map((outer) =>
//         outer.reduce((acc, curr) => ({...acc, ...curr}), {})
//     );

console.log(elements);

const input = document.getElementById('input');
const output = document.getElementById('output');

input.oninput = () => {
    console.log('Input change')
    output.innerHTML = '';
    let outputString;
    elements.filter(element => element.name.includes(input.value))
        .map(result => outputString += (result.name + "<br />"));
    output.innerHTML = outputString;
}

