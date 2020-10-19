import IXsd from './IXsd'
import IXsdHash from './IXsdHash'

export default class XsdCollection {
    private xsdItems: IXsdHash = {}

    public add = (xsd: IXsd): IXsd => (this.xsdItems[xsd.path] = xsd)

    public update = (xsd: IXsd): IXsd => (this.xsdItems[xsd.path] = xsd)

    public delete = (path: string): boolean => delete this.xsdItems[path]

    public index = (): IXsdHash => this.xsdItems

    public show = (path: string): IXsd => this.xsdItems[path]
}
