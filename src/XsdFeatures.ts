import XsdManager from './XsdManager'
import XsdCompletion from './XsdCompletion'
import XsdValidation from './XsdValidation'
import { editor } from 'monaco-editor'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor

export default class XsdFeatures {
    private readonly xsdCollection: XsdManager
    private monaco: any
    private oldDecorations: string[] = []
    private editor: editor.IStandaloneCodeEditor

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

    public doValidation = () => {
        const xsdValidation = new XsdValidation(this.xsdCollection)
        const model = this.editor.getModel()
        this.oldDecorations = this.editor.deltaDecorations(
            this.oldDecorations,
            xsdValidation.decorations(model?.getValueInRange(model?.getFullModelRange())),
        )
    }

    public addCommands = () => {
        //
    }
}
