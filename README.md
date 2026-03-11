# Monaco XSD Code Completion
_A library to add XSD-based code completion, validation and more to the Monaco Editor._

The code completion is based on the XSD that is provided to the XsdManager. It is possible to use multiple XSD's, and namespaces.

Not all features of the XSD are supported, but the most common ones are. If you have a specific use case that is not supported, please open an issue or even better, a pull request.

The library is built to be as performant as possible, with O(1) lookups and caching of the code suggestions.

## Code completion

The code completion has support for multiple XSD's as long as they are referenced in the file.

Completion works for elements and attributes and starts after the user presses: `<`, ` ` or `/`. The required attribute will allways be preselected. When the completion is getting invoked using `Ctrl`+`Space`, the code will be inserted as snippet.

Documentation is provided for the attributes.

## XML Syntax and errors

The file will be parsed by the XMLDom parser, every error will be shown in the editor. Hovering over the lines will reveal the details.

## Template

The user can generate a template based on the XSD referenced in the root tag.

## Reformat code

The user can reformat the code with the action provided in the menu, or by using the key combination `Ctrl`+`Shift`+`L`

## Usage

```javascript
import getBusinessPartnerDataXML from './GetBusinessPartnerData_7.xml'
import commonMessageHeader2 from './CommonMessageHeader_2.xsd'
import getBusinessPartnerData from './GetBusinessPartnerData_7.xsd'
import ibisdoc from './ibisdoc.xsd'
import * as monaco from 'monaco-editor'
import XsdManager from '../monaco-xsd-code-completion/esm/XsdManager'
import XsdFeatures from '../monaco-xsd-code-completion/esm/XsdFeatures'
import '../monaco-xsd-code-completion/src/style.css'

const editor = monaco.editor.create(document.getElementById('container'), {
    value: getBusinessPartnerDataXML,
    language: 'xml',
    theme: 'vs-dark',
})

const xsdManager = new XsdManager(editor) // Initialise the xsdManager

xsdManager.set({
    path: 'ibisdoc.xsd', // Path that will be referenced in the xml.
    value: ibisdoc, // String containing XSD.
    namespace: 'xs', // The namespace used inside the XSD (xsd or xs). *optional
    includeIfRootTag: ['Configuration', 'Adapter', 'Module'], // Include XSD based on the root tag of the file. *optional
})

xsdManager.set({
    path: 'CommonMessageHeader_2.xsd',
    value: commonMessageHeader2,
    alwaysInclude: true, // Include the XSD even if there's no reference. This could be useful if the XSD is server-side only.
})

xsdManager.set({
    path: 'booking.xsd',
    value: booking,
    namespace: 'xs',
    nonStrictPath: true, // The path reference only has to include the path partially ({some path}/ibisdoc.xsd). *optional
})

xsdManager.set({
    path: 'GetBusinessPartnerData_7.xsd',
    value: getBusinessPartnerData,
})

const xsdFeatures = new XsdFeatures(xsdManager, monaco, editor) // Initialise the xsdFeatures.

xsdFeatures.addCompletion() // Add auto completion.
xsdFeatures.addValidation() // Add auto validation on debounce. Can be manually triggered with doValidation.
xsdFeatures.addGenerateAction() // Add geneate template to actions menu. Generate can be run with doGenerate.
xsdFeatures.addReformatAction() // Add reformat code to actions menu. Can be run manually with doReformatCode.
```

## ToDo

- [x] Parse XSD
- [x] Code completion based on XSD
- [x] Cache code suggestions
- [x] Autocomplete close tags
- [x] Insert element als snippet (or template)
- [x] Auto indentation ([RP for Monaco-languages](https://github.com/microsoft/monaco-languages/pull/113))
- [x] Implement namespaces
    - [x] Get suggestions from multiple XSD's
    - [x] Append namespace to suggestions
    - [x] Get element ref attributes (thanks @Rafeethu)
        - [x] Replace element ref namespace with namespace used in the XML.
- [x] Performance optimization (pre-built Map indexes, O(1) lookups, XPath removed)
- [x] Show syntax errors
- [x] Template based on XSD
- [x] Reformat code

## Development and testing

There is a test environment available at [philipsens/monaco-xsd-code-completion-test-env](https://github.com/philipsens/monaco-xsd-code-completion-test-env). This environment is set up to easily test a development version of the package. 
