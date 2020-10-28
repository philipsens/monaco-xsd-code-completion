import IXsd from './interface/IXsd'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as XsdWorker from 'worker-loader?inline=fallback!./xsd.worker'

export default class XsdManager {
    // private xsdWorkers: Map<string, WebpackWorker>
    private monaco: any

    constructor(monaco: any) {
        // this.xsdWorkers = new Map()
        this.monaco = monaco

        let worker: Worker

        try {
            worker = new XsdWorker()
        } catch (error) {
            worker = new Worker('xsd-worker.js')
        }

        worker.postMessage('test')
        worker.addEventListener('message', (msg: any) => {
            worker.terminate()
            console.log(msg.data)
        })
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
