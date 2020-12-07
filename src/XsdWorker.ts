import CodeSuggester from './CodeSuggester'
import { CompletionType, ICompletion, IXsd } from './types'

export class XsdWorker {
    private codeSuggester: CodeSuggester
    private namespace: string | undefined
    public xsd: IXsd

    constructor(xsd: IXsd) {
        this.xsd = xsd
        this.codeSuggester = new CodeSuggester(xsd)
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
    // TODO: doValidation
    // TODO: doGenerateTamplate
}
