import CodeSuggester from './CodeSuggester'
import { CompletionType, ICompletion, IXsd } from './types'
import XsdParser from './XsdParser'

export class XsdWorker {
    private codeSuggester: CodeSuggester
    private namespace: string | undefined
    private readonly xsdParser: XsdParser
    public xsd: IXsd

    constructor(xsd: IXsd) {
        this.xsd = xsd
        this.xsdParser = new XsdParser(this.xsd)
        this.codeSuggester = new CodeSuggester(this.xsdParser)
    }

    public withNamespace = (namespace: string): XsdWorker => {
        this.namespace = namespace
        return this
    }

    public doCompletion = (completionType: CompletionType, parentTag: string): ICompletion[] => {
        switch (completionType) {
            case CompletionType.snippet:
                return this.codeSuggester.elements(parentTag, this.namespace, true)
            case CompletionType.element:
                return this.codeSuggester.elements(parentTag, this.namespace)
            case CompletionType.attribute:
                return this.codeSuggester.attributes(parentTag)
            case CompletionType.incompleteElement:
                return this.codeSuggester.elements(parentTag, this.namespace, false, true)
            case CompletionType.incompleteAttribute:
                return this.codeSuggester.attributes(parentTag, true)
        }
        return []
    }

    public getFirstSubElements = (parentTag: string, withAttributes: boolean) =>
        this.xsdParser.getFirstSubElements(parentTag, withAttributes)
}
