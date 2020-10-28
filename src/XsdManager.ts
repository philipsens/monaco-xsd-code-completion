import IXsd from './IXsd'
import XsdWorker from './xsd.worker'

export default class XsdManager {
    // private xsdWorkers: Map<string, WebpackWorker>
    private monaco: any

    constructor(monaco: any) {
        // this.xsdWorkers = new Map()
        this.monaco = monaco

        const worker = new XsdWorker()
        worker.ctx.postMessage({ num: 4 })
        worker.ctx.onmessage = (e: MessageEvent<any>) => {
            console.log('xsdManager: ', e.data)
        }
    }

    public set = (xsd: IXsd): void => {
        // const worker = new XsdWorker()
        //
        // worker.postMessage({ a: 1 })
    }

    public update = (xsd: IXsd): void => {
        // this.delete(xsd.path)
        this.set(xsd)
    }

    // public delete = (path: string): boolean => {
        // this.xsdWorkers.get(path)?.dispose()
        // return this.xsdWorkers.delete(path)
    // }

    // public get = (path: string): Worker | undefined => this.xsdWorkers.get(path)
}
