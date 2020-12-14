import { XsdWorker } from './XsdWorker'
import { IXsd } from './types'

export default class XsdManager {
    private xsdWorkers: Map<string, XsdWorker>
    private monaco: any

    constructor(monaco: any) {
        this.xsdWorkers = new Map()
        this.monaco = monaco

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
}
