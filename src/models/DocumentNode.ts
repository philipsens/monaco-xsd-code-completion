export default class DocumentNode {
    public name: string
    private type?: string
    private use?: string
    public documentation?: string

    constructor(name: string) {
        this.name = name
    }

    isRequired = (): boolean => this.use === 'required'
    getType = (): string => (this.type ? this.type.split(':')[1] : '')
}
