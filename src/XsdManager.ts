import IXsd from './IXsd'
import WebpackWorker from './xsd.worker'

export default class XsdManager {
    // private xsdWorkers: Map<string, WebpackWorker>
    private monaco: any

    constructor(monaco: any) {
        // this.xsdWorkers = new Map()
        this.monaco = monaco
    }

    public set = (xsd: IXsd): void => {
        const worker = new WebpackWorker()
        //     moduleId: 'vs/language/xml/XsdWorker',
        //     label: 'xsd',
        //     createData: {
        //         languageSettings: xsd,
        //     },
        // })

        worker.addEventListener('message', (event: any) => {
            console.log(event.data)
        })
        worker.postMessage({ a: 1 })
        // this.xsdWorkers.set(xsd.path, worker)
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
