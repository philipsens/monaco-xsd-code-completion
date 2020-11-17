import { Range } from 'monaco-editor'
import XsdManager from './XsdManager'
// import xmllint from '../xml.js/xmllint'

export default class XsdValidation {
    private xsdManager: XsdManager

    constructor(xsdManager: XsdManager) {
        this.xsdManager = xsdManager
    }

    decorations = (xml: string | undefined) => {
        console.log(xml)
        //
        // if (xml) {
        //     console.log(xmllint)
        //     const validatedXml = xmllint.validateXML({
        //         xml: xml,
        //         schema: '',
        //     })
        //     console.log(validatedXml)
        // }

        return [
            {
                range: new Range(3, 9, 3, 17),
                options: {
                    className: 'xml-lint xml-lint--warning',
                    hoverMessage: [
                        {
                            value: '*Error*',
                        },
                        {
                            value: 'Unsupported attribute',
                        },
                        {
                            value: 'Source: [ibisdoc.xsd](test)',
                        },
                    ],
                },
            },
        ]
    }
}
