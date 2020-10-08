export default class DocumentNode {
    public name!: string
    private readonly type?: string
    private readonly use?: string
    public documentation?: string

    get isRequired(): boolean {
        return this.use === 'required'
    }

    get getType(): string {
        return this.type ? this.type.split(':')[1] : ''
    }
}
