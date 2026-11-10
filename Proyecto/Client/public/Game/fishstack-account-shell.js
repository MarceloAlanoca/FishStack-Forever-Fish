// Incluir desde el shell Web de Godot: <script src="/Game/fishstack-account-shell.js"></script>
// El JWT permanece en React. Este adaptador solo transporta mensajes JSON.
;(() => {
    const origin = window.location.origin
    const channel = 'fishstack-account'
    const protocolVersion = 1
    const validId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    const allowed = new Set(['ACCOUNT_INIT', 'SAVE_ACK', 'SAVE_ERROR', 'WALLET_RESULT', 'WALLET_UPDATED', 'SESSION_ENDED'])
    let receiver = null
    let binding = null
    let readyId = null
    let ended = false

    function post(type, requestId, payload) {
        if (window.parent === window || !validId(requestId)) return false
        const message = { channel, protocolVersion, type, requestId,
            accountId: type === 'GODOT_READY' ? null : binding?.accountId ?? null,
            sessionId: type === 'GODOT_READY' ? null : binding?.sessionId ?? null, payload }
        const text = JSON.stringify(message)
        if (new TextEncoder().encode(text).length > 300000) return false
        window.parent.postMessage(text, origin)
        return true
    }
    window.addEventListener('message', event => {
        if (event.origin !== origin || event.source !== window.parent || typeof event.data !== 'string' ||
            event.data.length > 300000 || new TextEncoder().encode(event.data).length > 300000) return
        try {
            const message = JSON.parse(event.data)
            if (!receiver || !message || message.channel !== channel || message.protocolVersion !== protocolVersion ||
                !validId(message.requestId) || !allowed.has(message.type)) return
            if (message.type === 'ACCOUNT_INIT') {
                if (message.requestId !== readyId || typeof message.accountId !== 'string' || !validId(message.sessionId)) return
                binding = { accountId: message.accountId, sessionId: message.sessionId }
                ended = false
            } else if (!binding && message.type === 'SAVE_ERROR') {
                // El fallo de carga puede llegar antes de ACCOUNT_INIT; no habilita la cuenta.
                if (message.requestId !== readyId || typeof message.accountId !== 'string' || !message.accountId ||
                    !validId(message.sessionId) || !message.payload ||
                    typeof message.payload.code !== 'string' || typeof message.payload.message !== 'string' ||
                    typeof message.payload.retryable !== 'boolean') return
            } else if (!binding || message.accountId !== binding.accountId || message.sessionId !== binding.sessionId) return
            if (message.type === 'SESSION_ENDED') ended = true
            receiver(event.data)
        } catch { /* JSON o callback inválido: no ejecutar código recibido. */ }
    })
    window.FishStackAccount = Object.freeze({
        attach(callback) {
            if (typeof callback !== 'function' || window.parent === window) return false
            receiver = callback
            binding = null
            ended = false
            readyId = crypto.randomUUID()
            return post('GODOT_READY', readyId, { schemaVersions: [1] })
        },
        retry() { return readyId ? post('GODOT_READY', readyId, { schemaVersions: [1] }) : false },
        newRequestId() { return crypto.randomUUID() },
        send(type, requestId, payloadJson = '{}') {
            if (!binding || (ended && type !== 'SESSION_ENDED_ACK') ||
                !['ACCOUNT_APPLIED', 'SAVE_PROGRESS', 'WALLET_OPERATION', 'SESSION_ENDED_ACK'].includes(type) ||
                typeof payloadJson !== 'string' || payloadJson.length > 270000) return false
            try { return post(type, requestId, JSON.parse(payloadJson)) }
            catch { return false }
        },
        detach() { receiver = null; binding = null; readyId = null; ended = true }
    })
})()
