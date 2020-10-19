import XsdCollection from './XsdCollection'
import XsdCompletion from './XsdCompletion'

export default class XsdFacade {
    private readonly xsdCollection: XsdCollection
    private monaco: any

    constructor(xsdXollection: XsdCollection, monaco: any) {
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
