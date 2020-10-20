import IXsd from './IXsd'

export default class XsdCollection {
    private xsdItems: Map<string, IXsd>

    constructor() {
        this.xsdItems = new Map()
    }

    public set = (xsd: IXsd): Map<string, IXsd> => this.xsdItems.set(xsd.path, xsd)

    public delete = (path: string): boolean => this.xsdItems.delete(path)

    public entries = (): IterableIterator<[string, IXsd]> => this.xsdItems.entries()

    public get = (path: string): IXsd | undefined => this.xsdItems.get(path)
}
