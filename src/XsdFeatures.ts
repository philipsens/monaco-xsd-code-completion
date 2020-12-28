import XsdManager from './XsdManager'
import XsdCompletion from './XsdCompletion'
import XsdValidation from './XsdValidation'
import { editor } from 'monaco-editor'
import { debounce } from 'ts-debounce'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor

export default class XsdFeatures {
    private readonly xsdCollection: XsdManager
    private monaco: any
    private oldDecorations: string[] = []
    private editor: editor.IStandaloneCodeEditor
    private xsdValidation: XsdValidation | undefined

    constructor(xsdXollection: XsdManager, monaco: any, editor: IStandaloneCodeEditor) {
        this.xsdCollection = xsdXollection
        this.monaco = monaco
        this.editor = editor

        this.editor.updateOptions({
            wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;\'",.<>/?',
        })
    }

    public addCompletion = (): void => {
        const xsdCompletion = new XsdCompletion(this.xsdCollection)
        this.monaco.languages.registerCompletionItemProvider('xml', xsdCompletion.provider())
    }

    public doValidation = (): void => {
        console.log('validate')
        this.xsdValidation = this.xsdValidation ?? new XsdValidation(this.xsdCollection)
        const model = this.editor.getModel()
        const newDecorations = this.xsdValidation.decorations(model)
        this.oldDecorations = this.editor.deltaDecorations(this.oldDecorations, newDecorations)
    }

    public addValidation = (): void => {
        this.xsdValidation = new XsdValidation(this.xsdCollection)
        const debouncedDoValidation = debounce(this.doValidation, 1000)
        this.editor.onKeyDown(debouncedDoValidation)
        this.doValidation()
    }
}
