import { editor, Range } from 'monaco-editor'
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
                    this.errors.push({ message: message, type: ErrorType.warning }),
                error: (message: string) =>
                    this.errors.push({ message: message, type: ErrorType.error }),
                fatalError: (message: string) =>
                    this.errors.push({ message: message, type: ErrorType.fetalError }),
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
        range: this.getRangeFromError(error),
        options: {
            className: this.getClassNamesForError(error),
            hoverMessage: [
                {
                    value: this.getErrorTypeValueFromError(error),
                },
                {
                    value: this.getErrorMessageFromError(error),
                },
                {
                    value: '*XML DOM Parser*',
                },
            ],
        },
    })

    getErrorTypeValueFromError = (error: XmlDomError): string => {
        switch (error.type) {
            case ErrorType.warning:
                return '**Warning**'
            case ErrorType.error:
                return '**Error**'
            case ErrorType.fetalError:
                return '**Fatal error**'
        }
    }

    getClassNamesForError = (error: XmlDomError): string => {
        switch (error.type) {
            case ErrorType.warning:
                return 'xml-lint xml-lint--warning'
            case ErrorType.error:
                return 'xml-lint xml-lint--error'
            case ErrorType.fetalError:
                return 'xml-lint xml-lint--fetal'
        }
    }

    getErrorMessageFromError = (error: XmlDomError): string =>
        error.message.split(/[\t\n]/g)[1] ?? error.message

    getRangeFromError = (error: XmlDomError): Range => {
        const lineMatch = error.message.match(/(?<=line:)[0-9]+/g)
        const colMatch = error.message.match(/(?<=col:)[0-9]+/g)

        const line = parseInt((lineMatch ?? 0)[0])
        const col = parseInt((colMatch ?? 0)[0])

        // TODO: GetWordAt.
        return new Range(line, col, line, col + 10)
    }
}
