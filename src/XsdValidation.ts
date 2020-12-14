import { editor, IPosition, Range } from 'monaco-editor'
import XsdManager from './XsdManager'
import xmldom from 'xmldom'
import { ErrorType, XmlDomError } from './types'
import IModelDeltaDecoration = editor.IModelDeltaDecoration
import ITextModel = editor.ITextModel

export default class XsdValidation {
    private xsdManager: XsdManager
    private dom: xmldom.DOMParser
    private errors: XmlDomError[] = []
    private model: editor.ITextModel | null = null

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

    decorations = (model: ITextModel | null): IModelDeltaDecoration[] => {
        this.errors = []
        this.model = model
        const xml = model?.getValueInRange(model?.getFullModelRange())

        if (xml) {
            this.dom.parseFromString(xml)
            // TODO: Implement XMLLint after XML DOM Parser
        }

        return this.getDecorationsFromErrors()
    }

    getDecorationsFromErrors = (): IModelDeltaDecoration[] =>
        this.errors.map(this.getDecorationsFromError)

    getDecorationsFromError = (error: XmlDomError): IModelDeltaDecoration => ({
        range: this.getWordRangeFromErrorPosition(error.position),
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

    getWordRangeFromErrorPosition = (position: IPosition): Range => {
        const length = this.model?.getWordAtPosition(position)?.word.length
        if (length)
            return new Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column + length,
            )
        else
            return new Range(
                position.lineNumber,
                position.column - 1,
                position.lineNumber,
                position.column + 2,
            )
    }
}
