import IXsd from './interface/IXsd'
import { worker } from 'monaco-editor'
import IWorkerContext = worker.IWorkerContext

export class XsdWorker {
    private xsd: IXsd

    constructor(workerContext: IWorkerContext, createData: ICreateData) {
        this.xsd = createData.xsd
    }

    public doCompletion = (): string => {
        return 'Ik ben een worker voor ' + this.xsd.path
    }
}

export interface ICreateData {
    xsd: IXsd
}

export const create = (workerContext: IWorkerContext, createData: ICreateData): XsdWorker => {
    return new XsdWorker(workerContext, createData)
}
