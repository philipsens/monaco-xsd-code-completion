// const ctx: Worker = self as any
//
// ctx.addEventListener('message', (event) => {
//     console.log('dit is de worker', event.data)
//     if (event.data.num) {
//         ctx.postMessage(event.data.num * event.data.num)
//     }
// })

// export default ctx as any

export default class XsdWorker {
    _ctx: Worker

    constructor() {
        this._ctx = self as any

        this._ctx.addEventListener('message', (event) => {
            console.log('dit is de worker', event.data)
            if (event.data.num) {
                this._ctx.postMessage(event.data.num * event.data.num)
            }
        })
    }

    get ctx() {
        return this._ctx
    }
}
