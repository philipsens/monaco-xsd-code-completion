import { editor } from 'monaco-editor'
import XsdManager from './XsdManager'
import xmldom from 'xmldom'
import { ErrorType, XmlDomError } from './types'
import IModelDeltaDecoration = editor.IModelDeltaDecoration

export default class XsdValidation {
    private xsdManager: XsdManager
    private dom: xmldom.DOMParser
    private errors: XmlDomError[] = []

    constructor(xsdManager: XsdManager) {
        this.xsdManager = xsdManager
        this.dom = new xmldom.DOMParser({
            locator: {},
            errorHandler: {
                warning: (message: string) =>
                    this.errors.push(new XmlDomError(message, ErrorType.warning)),
                error: (message: string) =>
                    this.errors.push(new XmlDomError(message, ErrorType.error)),
                fatalError: (message: string) =>
                    this.errors.push(new XmlDomError(message, ErrorType.fetalError)),
            },
        })
    }

    decorations = (xml: string | undefined): IModelDeltaDecoration[] => {
        if (xml) {
            this.dom.parseFromString(xml)
            // TODO: Implement XMLLint after XML DOM Parser
        }

        return this.getDecorationsFromErrors()
    }

    getDecorationsFromErrors = (): IModelDeltaDecoration[] =>
        this.errors.map(this.getDecorationsFromError)

    getDecorationsFromError = (error: XmlDomError): IModelDeltaDecoration => ({
        range: error.range,
        options: {
            className: error.classNames,
            hoverMessage: [
                {
                    value: error.errorTypeString,
                },
                {
                    value: error.errorMessage,
                },
                {
                    value: '*XML DOM Parser*',
                },
            ],
        },
    })
}
