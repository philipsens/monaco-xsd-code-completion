import XsdManager from './XsdManager'
import XsdCompletion from './XsdCompletion'

export default class XsdFeatures {
    private readonly xsdCollection: XsdManager
    private monaco: any

    constructor(xsdXollection: XsdManager, monaco: any) {
        this.xsdCollection = xsdXollection
        this.monaco = monaco
    }

    public addCompletion = (): void => {
        const xsdCompletion = new XsdCompletion(this.xsdCollection)
        this.monaco.languages.registerCompletionItemProvider('xml', xsdCompletion.provider())
    }

    public addValidation = () => {
        //
    }

    public addCommands = () => {
        //
    }
}
