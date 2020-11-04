import IXsd from './IXsd'
import { CompletionType } from './CompletionType'
import CodeSuggester from './CodeSuggester'
import ICompletion from './ICompletion'

export class XsdWorker {
    private codeSuggester: CodeSuggester
    private namespace: string | undefined

    constructor(xsd: IXsd) {
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
