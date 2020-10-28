const ctx: Worker = self as any

// Respond to message from parent thread
ctx.addEventListener('message', (message) => {
    ctx.postMessage(null, undefined)
})
