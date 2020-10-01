import ibisdocXSD from './ibisdoc.xsd'
import XSDParser from './XSDParser.js'
import * as monaco from 'monaco-editor'
import XSDCodeCompletion from './XSDCodeCompletionProvider'
import * as languages from 'monaco-editor'

const ibisdoc = new XSDParser(ibisdocXSD)
const xsdCodeCompletion = new XSDCodeCompletion(ibisdoc)

const editor = monaco.editor.create(document.getElementById('container'), {
    value: [
        '<Configuration name="Example1"\n' +
            '\txmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
            '\txsi:noNamespaceSchemaLocation="./ibisdoc.xsd">\n' +
            '</Configuration>',
    ].join('\n'),
    language: 'xml',
})

monaco.languages.registerCompletionItemProvider('xml', xsdCodeCompletion.provider())
