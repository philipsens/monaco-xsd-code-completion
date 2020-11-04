export default class DocumentNode {
    public name!: string
    public documentation?: string
    private readonly type?: string
    private readonly use?: string

    get isRequired(): boolean {
        return this.use === 'required'
    }

    get getType(): string {
        return this.type ? this.type.split(':')[1] : ''
    }
}
