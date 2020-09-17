import ibisdocXSD from './ibisdoc.xsd'
import XSDParser from './XSDParser.js'
import * as monaco from 'monaco-editor';
import XSDCodeCompletion from "./XSDCodeCompletionProvider";

const ibisdoc = new XSDParser(ibisdocXSD);
const xsdCodeCompletion = new XSDCodeCompletion(ibisdoc)

monaco.languages.registerCompletionItemProvider('xml', xsdCodeCompletion.provider())

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