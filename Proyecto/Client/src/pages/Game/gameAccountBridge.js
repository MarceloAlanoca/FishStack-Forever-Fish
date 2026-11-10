import { COMMERCE_OPS, DECLINES, validCommerce, checkCommerce } from './commerceProtocol.js'
import { gamePendingStore } from './gamePendingStore.js'

export const GAME_CHANNEL = 'fishstack-account'
export const PROTOCOL_VERSION = 1
export const validRequestId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export function parseGameMessage(event, { origin, source }) {
    if (event.origin !== origin || event.source !== source || typeof event.data !== 'string' || event.data.length > 300000) return null
    if (new TextEncoder().encode(event.data).length > 300000) return null
    try {
        const data = JSON.parse(event.data)
        if (!data || data.channel !== GAME_CHANNEL || data.protocolVersion !== PROTOCOL_VERSION || !validRequestId(data.requestId)) return null
        return data
    } catch { return null }
}

function problem(code, message) { return Object.assign(new Error(message), { code }) }

export class GameAccountBridge {
    constructor({ accountId, token, getToken, origin, getWindow, api, onState, onWallet, store = gamePendingStore, newId = () => crypto.randomUUID() }) {
        Object.assign(this, { accountId: String(accountId), token, getToken, origin, getWindow, api, onState, onWallet, store, newId })
        this.sessionId = newId()
        this.active = true
        this.applied = false
        this.walletRevision = -1
        this.wallet = null
        this.initializing = null
        this.saving = null
        this.blocked = false
        this.pending = null
    }

    current() { return this.active && this.getToken() === this.token }
    status(status, message, canDiscard = false) { if (this.active) this.onState({ status, message, canDiscard }) }
    send(type, requestId, payload) {
        if (!this.active) return
        this.getWindow()?.postMessage(JSON.stringify({ channel: GAME_CHANNEL, protocolVersion: PROTOCOL_VERSION,
            type, requestId, sessionId: this.sessionId, accountId: this.accountId, payload }), this.origin)
    }
    acceptWallet(wallet) {
        if (!wallet || !Number.isSafeInteger(wallet.balance) || wallet.balance < 0 || !Number.isSafeInteger(wallet.revision)) return
        if (wallet.revision > this.walletRevision) {
            this.walletRevision = wallet.revision
            this.wallet = { balance: wallet.balance, revision: wallet.revision }
            this.onWallet(this.wallet)
            if (this.applied) this.send('WALLET_UPDATED', this.newId(), { wallet: this.wallet })
        }
    }
    checkRecord(record) {
        if (!record || record.accountId !== this.accountId) throw problem('ACCOUNT_MISMATCH', 'La respuesta no corresponde a esta cuenta.')
        if (!this.current()) throw problem('AUTH_REQUIRED', 'La sesión del juego terminó.')
    }
    checkSaleRecord(record, request) {
        const sale = record.sale
        if (!sale || sale.requestId !== request.requestId || sale.revision !== request.baseRevision + 1 ||
            !Number.isSafeInteger(record.revision) || record.revision < sale.revision ||
            !Number.isSafeInteger(sale.total) || sale.total < 0 || sale.total > 2147483647 ||
            sale.soldCount !== request.captureIds.length || !Array.isArray(sale.captureIds) ||
            JSON.stringify([...sale.captureIds].sort()) !== JSON.stringify([...request.captureIds].sort()) ||
            record.state?.schemaVersion !== 1 || !Array.isArray(record.state.historia?.bodega_barco) ||
            record.state.historia.bodega_barco.length !== 100 ||
            record.state.historia.bodega_barco.some(fish => request.captureIds.includes(fish?.captureId)) ||
            !Number.isSafeInteger(record.wallet?.balance) || record.wallet.balance < 0 ||
            !Number.isSafeInteger(record.wallet.revision) || record.wallet.revision < 0) {
            throw problem('INVALID_SALE_RESPONSE', 'No se pudo comprobar el recibo de venta. Se conserva la solicitud para reintentar.')
        }
    }
    operationError(kind, requestId, payload, operation) {
        if (kind === 'sale' || kind === 'commerce') this.send('WALLET_RESULT', requestId, { ok: false, operation: kind === 'sale' ? 'SELL_FISH' : operation, ...payload })
        else this.send('SAVE_ERROR', requestId, payload)
    }
    failure(error, requestId, kind = 'save', operation) {
        if (!this.active) return
        const http = error.response?.status
        const code = error.response?.data?.code || error.code || (http === 401 || http === 403 ? 'AUTH_REQUIRED' : 'NETWORK')
        const message = error.response?.data?.message || error.message || 'No se pudo conectar con la cuenta.'
        if (http === 401 || http === 403 || code === 'AUTH_REQUIRED') { this.end('expired'); return }
        const retryable = !http || http >= 500
        if (!retryable) this.blocked = true
        if (requestId) this.operationError(kind, requestId, { code, message, retryable, revision: error.response?.data?.revision }, operation)
        this.status(retryable ? 'offline' : 'conflict', message, Boolean(this.pending) && !retryable)
    }

    async initialize(requestId) {
        if (this.initializing || this.applied) return
        this.status('loading', 'Cargando la partida de tu cuenta…')
        this.initializing = (async () => {
            try {
                let record = await this.api.load()
                const accountFeatures = record.features
                this.checkRecord(record)
                this.pending = await this.store.get(this.accountId)
                if (!this.current()) return
                if (this.pending) {
                    if (this.pending.accountId !== this.accountId) throw problem('ACCOUNT_MISMATCH', 'El guardado pendiente pertenece a otra cuenta.')
                    record = await (this.pending.kind === 'sale' ? this.api.sell(this.pending.request) : this.pending.kind === 'commerce' ? this.api.commerce(this.pending.request) : this.api.save(this.pending.request))
                    this.checkRecord(record)
                    if (this.pending.kind === 'sale') this.checkSaleRecord(record, this.pending.request)
                    if (this.pending.kind === 'commerce') checkCommerce(record, this.pending.request)
                    await this.store.remove(this.accountId)
                    this.pending = null
                } else if (!record.exists) {
                    record = await this.api.initialize()
                    this.checkRecord(record)
                }
                if (!this.current()) return
                this.revision = record.revision
                this.acceptWallet(record.wallet)
                this.initRequestId = requestId
                this.initMessage = { state: record.state, revision: record.revision, wallet: this.wallet, isNew: record.isNew,
                    features: { fishSales: true, fishCatalogVersion: 1, commerce: (record.features || accountFeatures)?.commerce === true, commerceCatalogVersion: (record.features || accountFeatures)?.commerceCatalogVersion, commerceCatalogHash: (record.features || accountFeatures)?.commerceCatalogHash } }
                this.send('ACCOUNT_INIT', requestId, this.initMessage)
                this.status('applying', 'Esperando que Godot termine de cargar tu partida…')
            } catch (error) { this.failure(error, requestId) }
            finally { this.initializing = null }
        })()
        return this.initializing
    }

    async save(message, kind = 'save') {
        const operation = kind === 'commerce' ? message.payload?.operation : undefined
        if (this.saving) {
            if (this.saveRequestId === message.requestId && this.saveKind === kind) return this.saving
            this.operationError(kind, message.requestId, { code: 'SAVE_IN_PROGRESS', message: 'Espera la confirmacion de la operacion anterior.', retryable: true }, operation)
            return
        }
        if (this.blocked) {
            this.operationError(kind, message.requestId, { code: 'REVISION_CONFLICT', message: 'Resuelve el conflicto antes de enviar otra operacion.', retryable: false }, operation)
            return
        }
        this.saveRequestId = message.requestId
        this.saveKind = kind
        this.saving = Promise.resolve().then(async () => {
            try {
                const payload = message.payload
                const valid = payload && Number.isSafeInteger(payload.baseRevision) && payload.baseRevision >= 1 &&
                    (kind === 'commerce' ? validCommerce(payload) : kind === 'sale' ? payload.operation === 'SELL_FISH' && Array.isArray(payload.captureIds) &&
                        payload.captureIds.length > 0 && payload.captureIds.length <= 100 && payload.captureIds.every(validRequestId) &&
                        new Set(payload.captureIds).size === payload.captureIds.length &&
                        Object.keys(payload).every(key => ['operation', 'baseRevision', 'captureIds'].includes(key))
                        : payload.state && typeof payload.state === 'object')
                if (!valid) {
                    this.operationError(kind, message.requestId, { code: 'VALIDATION_FAILED', message: 'La solicitud no tiene el formato requerido.', retryable: false }, operation)
                    return
                }
                const request = kind === 'commerce' ? { requestId: message.requestId, ...payload } : kind === 'sale'
                    ? { requestId: message.requestId, baseRevision: payload.baseRevision, captureIds: [...payload.captureIds].sort() }
                    : { requestId: message.requestId, baseRevision: payload.baseRevision, state: payload.state }
                const pending = await this.store.get(this.accountId)
                if (!this.current()) return
                if (pending && ((pending.kind || 'save') !== kind || JSON.stringify(pending.request) !== JSON.stringify(request))) {
                    this.pending = pending
                    this.operationError(kind, message.requestId, { code: 'PENDING_SAVE', message: 'Reintenta la operacion pendiente con la misma referencia.', retryable: true }, operation)
                    return
                }
                this.pending = { accountId: this.accountId, kind, request, createdAt: pending?.createdAt || new Date().toISOString() }
                await this.store.put(this.pending)
                if (!this.current()) return
                this.status('saving', kind === 'sale' ? 'Confirmando la venta de peces.' : kind === 'commerce' ? 'Confirmando la operacion.' : 'Guardando en tu cuenta.')
                const record = await (kind === 'sale' ? this.api.sell(request) : kind === 'commerce' ? this.api.commerce(request) : this.api.save(request))
                this.checkRecord(record)
                if (kind === 'sale') this.checkSaleRecord(record, request)
                if (kind === 'commerce') checkCommerce(record, request)
                await this.store.remove(this.accountId)
                this.pending = null
                if (!this.current()) return
                this.revision = record.revision
                this.acceptWallet(record.wallet)
                if (kind === 'commerce') {
                    const requiresReload = record.revision !== record.receipt.revision
                    this.send('WALLET_RESULT', message.requestId, { ok: true, operation: request.operation, revision: record.revision, state: record.state, wallet: record.wallet, receipt: record.receipt, replayed: record.replayed, requiresReload })
                    if(requiresReload) this.blocked = true
                    this.status(requiresReload ? 'conflict' : 'synced', requiresReload ? 'Operacion confirmada. Recarga la partida actual.' : 'Operacion confirmada.')
                } else if (kind === 'sale') {
                    const requiresReload = record.revision !== record.sale.revision
                    this.send('WALLET_RESULT', message.requestId, { ok: true, operation: 'SELL_FISH',
                        revision: record.revision, state: record.state, wallet: record.wallet, sale: record.sale,
                        replayed: record.replayed, requiresReload })
                    if (requiresReload) this.blocked = true
                    this.status(requiresReload ? 'conflict' : 'synced', requiresReload
                        ? 'Venta confirmada. Otra pestaña avanzo la partida; vuelve a cargar el juego.'
                        : 'Venta confirmada: ' + record.sale.total + ' doblones.')
                } else {
                    this.send('SAVE_ACK', message.requestId, { revision: record.revision, updatedAt: record.updatedAt, state: record.state })
                    this.status('synced', 'Partida guardada en tu cuenta.')
                }
            } catch (error) {
                if (!this.current()) { if (this.active) this.end('account_changed'); return }
                if (kind === 'commerce' && error.response?.data?.committed === false && DECLINES.has(error.response.data.code)) {
                    try {
                        await this.store.remove(this.accountId)
                        if (!this.current()) return
                        this.pending = null
                        this.operationError(kind, message.requestId, { code: error.response.data.code,
                            message: error.response.data.message, retryable: false, committed: false }, operation)
                        this.status('synced', error.response.data.message)
                    } catch (storageError) { this.failure(storageError, message.requestId, kind, operation) }
                } else this.failure(error, message.requestId, kind, operation)
            }
            finally { this.saving = null }
        })
        return this.saving
    }

    async handle(event) {
        if (!this.current()) { if (this.active) this.end('account_changed'); return }
        const message = parseGameMessage(event, { origin: this.origin, source: this.getWindow() })
        if (!message) return
        if (message.type === 'GODOT_READY') {
            if (message.accountId !== null || message.sessionId !== null) return
            if (this.initMessage && !this.applied) {
                this.initRequestId = message.requestId
                this.initMessage.wallet = this.wallet
                this.send('ACCOUNT_INIT', message.requestId, this.initMessage)
                return
            }
            return this.initialize(message.requestId)
        }
        if (message.accountId !== this.accountId || message.sessionId !== this.sessionId) return
        if (message.type === 'ACCOUNT_APPLIED' && !this.applied && message.requestId === this.initRequestId) {
            this.applied = true
            if (this.wallet) this.send('WALLET_UPDATED', this.newId(), { wallet: this.wallet })
            this.status('synced', 'Cuenta conectada. El progreso se guardará cuando el juego lo solicite.')
        } else if (this.applied && message.type === 'SAVE_PROGRESS') return this.save(message)
        else if (this.applied && message.type === 'WALLET_OPERATION') {
            if (message.payload?.operation === 'SELL_FISH') return this.save(message, 'sale')
            if (COMMERCE_OPS.has(message.payload?.operation)) return this.save(message, 'commerce')
            this.send('WALLET_RESULT', message.requestId, { ok: false, code: 'FEATURE_NOT_AVAILABLE',
                message: 'Esta operacion no esta disponible.' })
        }
    }

    async poll() {
        if (!this.current()) { if (this.active) this.end('account_changed'); return }
        try {
            const record = await this.api.wallet()
            this.checkRecord(record)
            this.acceptWallet(record.wallet)
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) this.end('expired')
        }
    }
    end(reason = 'logout') {
        if (!this.active) return
        this.send('SESSION_ENDED', this.newId(), { reason })
        this.status('session-ended', 'La sesión del juego terminó.')
        this.active = false
        this.applied = false
    }
    async finish() {
        if (this.saving) {
            let timeout
            try { await Promise.race([this.saving, new Promise(resolve => { timeout = setTimeout(resolve, 2500) })]) }
            finally { clearTimeout(timeout) }
        }
        this.end('logout')
    }
    dispose() { this.end('unmounted') }
}
