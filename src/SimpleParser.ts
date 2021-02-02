import { editor } from 'monaco-editor'
import ITextModel = editor.ITextModel

export abstract class SimpleParser {
    public static getMatchesForRegex = (text: string, regex: RegExp): string[] => {
        const matches = text.match(regex)
        if (matches) return [...matches]
        return []
    }

    public static getFullText = (model: ITextModel): string =>
        model.getValueInRange(model.getFullModelRange())

    public static splitNamespaceAndTag = (tag: string): [string | undefined, string] => {
        const [partOne, partTwo] = tag.split(':')
        return partTwo ? [partOne, partTwo] : [undefined, partOne]
    }

    public static getFirstTag = (model: ITextModel | null): string | undefined => {
        const document = model?.getValue()
        if (document)
            return SimpleParser.getMatchesForRegex(document, /(?<=<|<\/)[^?\s|/>]+(?!.*\/>)/)[0]
    }
}
