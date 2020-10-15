import * as worker from 'monaco-editor/esm/vs/editor/editor.worker'
import xsdWorker from './xsdWorker'

self.onmessage = () => {
    worker.initialize((ctx, createData) => {
        return new xsdWorker(ctx, createData)
    })
}
