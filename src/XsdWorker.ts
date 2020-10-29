import IXsd from './IXsd'
import { CompletionType } from './CompletionType'
import CodeSuggester from './CodeSuggester'
import ICompletion from './ICompletion'

export class XsdWorker {
    private codeSuggester: CodeSuggester

    constructor(xsd: IXsd) {
        this.codeSuggester = new CodeSuggester(xsd)
    }

    public doCompletion = (
        completionType: CompletionType,
        parentTag: string,
        namespace = '',
    ): ICompletion[] => {
        console.log(namespace)
        switch (completionType) {
            case CompletionType.snippet:
                return this.codeSuggester.elements(parentTag, true)
            case CompletionType.element:
                return this.codeSuggester.elements(parentTag)
            case CompletionType.attribute:
                return this.codeSuggester.attributes(parentTag)
            case CompletionType.incompleteElement:
                return this.codeSuggester.elements(parentTag, false, true)
            case CompletionType.incompleteAttribute:
                return this.codeSuggester.attributes(parentTag, true)
        }
        return []
    }
    // TODO: doValidation
    // TODO: doGenerateTamplate
}
