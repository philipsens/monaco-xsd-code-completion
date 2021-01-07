import XsdManager from './XsdManager'
import XsdCompletion from './XsdCompletion'
import XsdValidation from './XsdValidation'
import { editor } from 'monaco-editor'
import { debounce } from 'ts-debounce'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import xsdGenerateTemplate from './XsdGenerateTemplate'

export default class XsdFeatures {
    private readonly xsdCollection: XsdManager
    private monaco: any
    private oldDecorations: string[] = []
    private editor: editor.IStandaloneCodeEditor
    private xsdValidation: XsdValidation | undefined
    private xsdGenerateTemplate: xsdGenerateTemplate | undefined

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

    public doGenerate = (levels: number, withAttributes: boolean): void => {
        this.xsdGenerateTemplate =
            this.xsdGenerateTemplate ?? new xsdGenerateTemplate(this.xsdCollection)
        const model = this.editor.getModel()
        const template = this.xsdGenerateTemplate.getTemplate(model, levels, withAttributes)
        if (template) model?.setValue(template)
    }

    public addGenerateAction = (): void => {
        this.xsdGenerateTemplate = new xsdGenerateTemplate(this.xsdCollection)
        this.editor.addAction({
            id: 'xsd-template-generate-without-attributes',
            label: 'Generate Template from XSD',
            keybindings: [
                this.monaco.KeyMod.CtrlCmd | this.monaco.KeyMod.Shift | this.monaco.KeyCode.KEY_G,
            ],
            contextMenuGroupId: '1_modification',
            contextMenuOrder: 1.5,
            run: () => this.doGenerate(parseInt(window.prompt('levels', '1') ?? ''), false),
        })
        this.editor.addAction({
            id: 'xsd-template-generate-with-attributes',
            label: 'Generate Template from XSD with requires attributes',
            keybindings: [
                this.monaco.KeyMod.CtrlCmd |
                    this.monaco.KeyMod.Alt |
                    this.monaco.KeyMod.Shift |
                    this.monaco.KeyCode.KEY_G,
            ],
            contextMenuGroupId: '1_modification',
            contextMenuOrder: 1.5,
            run: () => this.doGenerate(parseInt(window.prompt('levels', '1') ?? ''), true),
        })
    }
}
