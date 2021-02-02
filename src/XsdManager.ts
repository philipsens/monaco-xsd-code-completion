import { XsdWorker } from './XsdWorker'
import { IXsd } from './types'
import { SimpleParser } from './SimpleParser'
import { editor } from 'monaco-editor'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor

export default class XsdManager {
    private xsdWorkers: Map<string, XsdWorker>
    private editor: IStandaloneCodeEditor

    constructor(editor: IStandaloneCodeEditor) {
        this.xsdWorkers = new Map()
        this.editor = editor

        // const worker = new XsdWorker()
        // worker.ctx.postMessage({ num: 4 })
        // worker.ctx.onmessage = (e: MessageEvent<any>) => {
        //     console.log('xsdManager: ', e.data)
        // }
    }

    public set = (xsd: IXsd): void => {
        this.xsdWorkers.set(xsd.path, new XsdWorker(xsd))
    }

    public update = (xsd: IXsd): void => {
        this.delete(xsd.path)
        this.set(xsd)
    }

    public delete = (path: string): boolean => {
        // this.xsdWorkers.get(path)?.dispose()
        return this.xsdWorkers.delete(path)
    }

    public get = (path: string): XsdWorker | undefined => this.xsdWorkers.get(path)

    public has = (path: string): boolean => this.xsdWorkers.has(path)

    public getNonStrict = (path: string): XsdWorker | void => {
        for (const xsdWorker of this.xsdWorkers.values()) {
            if (xsdWorker.xsd.nonStrictPath && path.includes(xsdWorker.xsd.path)) return xsdWorker
        }
    }

    public getIncludedXsdWorkersWithoutReference = (): XsdWorker[] => {
        const firstTag = SimpleParser.getFirstTag(this.editor.getModel())
        return Array.from(this.xsdWorkers.values()).filter((xsdWorker) =>
            this.filterIncludedXsdWorkersWithNoReference(xsdWorker, firstTag),
        )
    }

    private filterIncludedXsdWorkersWithNoReference = (xsdWorker, firstTag) =>
        xsdWorker.xsd.alwaysInclude ||
        (firstTag && xsdWorker.xsd.includeIfRootTag?.includes(firstTag))
}
