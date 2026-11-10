// Una sola cola, separada por cuenta. Nunca almacena el JWT.
async function access(mode, action) {
    if (!globalThis.indexedDB) throw new Error('El navegador no permite conservar guardados pendientes.')
    return new Promise((resolve, reject) => {
        const open = indexedDB.open('fishstack-account-pending', 1)
        open.onupgradeneeded = () => open.result.createObjectStore('saves', { keyPath: 'accountId' })
        open.onerror = () => reject(open.error)
        open.onblocked = () => reject(new Error('Cierra otras pestañas del juego para habilitar el guardado.'))
        open.onsuccess = () => {
            const db = open.result
            const transaction = db.transaction('saves', mode)
            let result
            const request = action(transaction.objectStore('saves'))
            request.onsuccess = () => { result = request.result }
            transaction.oncomplete = () => { db.close(); resolve(result) }
            transaction.onerror = () => { db.close(); reject(transaction.error || new Error('No se pudo conservar el guardado pendiente.')) }
            transaction.onabort = () => { db.close(); reject(transaction.error || new Error('El guardado local fue cancelado.')) }
        }
    })
}

export const gamePendingStore = {
    get: accountId => access('readonly', store => store.get(String(accountId))),
    put: entry => access('readwrite', store => store.put(entry)),
    remove: accountId => access('readwrite', store => store.delete(String(accountId)))
}
