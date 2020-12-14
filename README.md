# Manaco XSD Code Completion

This is a basic and low resource way to provide client-side code completion and other features for the Monaco-editor.
The code completion is based on the XSD that is provided to the XsdManager. It is possible to use multiple XSD's, and namespaces.

The completions are gathered from the XSD at the moment they are needed. This is useful for very large XSD's that would have a long loading time when initially parsed. The completions may take a second but are instant after being cached.

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

const xsdManager = new XsdManager() // Initialise the xsdManager

xsdManager.set({
    path: 'ibisdoc.xsd', // Path that will be referenced in the xml.
    value: ibisdoc, // String containing XSD.
    namespace: 'xs', // The namespace used inside the XSD (xsd or xs). *optional
    nonStrictPath: true, // The path reference only has to include the path partially ({some path}/ibisdoc.xsd). *optional
})

xsdManager.set({
    path: 'CommonMessageHeader_2.xsd',
    value: commonMessageHeader2,
})

xsdManager.set({
    path: 'GetBusinessPartnerData_7.xsd',
    value: getBusinessPartnerData,
})

const xsdFeatures = new XsdFeatures(xsdManager, monaco, editor) // Initialise the xsdFeatures.

xsdFeatures.addCompletion() // Add auto completion.
xsdFeatures.addValidation() // Add auto validation on debounce. Can be manually triggered with doValidation.
```

## ToDo

-   [x] Parse XSD
-   [x] Code completion based on XSD
-   [x] Cache code suggestions
-   [x] Autocomplete close tags
-   [x] Insert element als snippit (or tamplate)
-   [x] Auto indentation ([RP for Monaco-languages](https://github.com/microsoft/monaco-languages/pull/113))
-   [x] Implement namespaces
    -   [x] Get suggestions from multiple XSD's
    -   [x] Append namespace to suggestions
-   [ ] Performance optimalisation
    -   [ ] Change parser (to SAX?)
    -   [ ] Make use of the Monaco workers for parallel parsing
-   [x] Show syntax errors
-   [ ] Template based on XSD
