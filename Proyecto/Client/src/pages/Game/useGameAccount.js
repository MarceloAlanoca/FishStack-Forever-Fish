import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../../config/api'
import { GameAccountBridge } from './gameAccountBridge'
import { gamePendingStore } from './gamePendingStore'

export default function useGameAccount(frameRef, accountId, onWallet) {
    const [connection, setConnection] = useState({ status: 'waiting', message: 'Esperando conexión del juego con tu cuenta.' })
    const [generation, setGeneration] = useState(0)
    const bridge = useRef(null)

    useEffect(() => {
        if (!accountId) return
        const token = localStorage.getItem('token')
        let mounted = true
        const controller = new AbortController()
        const config = { signal: controller.signal, timeout: 15000, headers: { Authorization: `Bearer ${token}` } }
        const active = new GameAccountBridge({ accountId, token, getToken: () => localStorage.getItem('token'),
            origin: window.location.origin, getWindow: () => frameRef.current?.contentWindow,
            api: {
                load: async () => (await axios.get(`${API_URL}/game/state`, config)).data,
                initialize: async () => (await axios.post(`${API_URL}/game/state`, {}, config)).data,
                save: async body => (await axios.put(`${API_URL}/game/state`, body, config)).data,
                sell: async body => (await axios.post(`${API_URL}/game/sales`, body, config)).data,
                commerce: async body => (await axios.post(`${API_URL}/game/commerce`, body, config)).data,
                wallet: async () => (await axios.get(`${API_URL}/game/wallet`, config)).data
            },
            onState: value => { if (mounted) setConnection(value) },
            onWallet: value => { if (mounted) onWallet(value) }
        })
        bridge.current = active
        const receive = event => { void active.handle(event) }
        const focus = () => { void active.poll() }
        const changed = event => { if (event.key === 'token' || event.key === null) void active.poll() }
        window.addEventListener('message', receive)
        window.addEventListener('focus', focus)
        window.addEventListener('storage', changed)
        const interval = setInterval(focus, 15000)
        const notice = setTimeout(() => {
            if (!active.initMessage && !active.initializing && active.current()) {
                active.status('waiting', 'Esta exportación aún no confirmó conexión con tu cuenta. El guardado remoto no está activo.')
            }
        }, 45000)
        void active.poll()
        return () => {
            mounted = false
            active.dispose()
            controller.abort()
            window.removeEventListener('message', receive)
            window.removeEventListener('focus', focus)
            window.removeEventListener('storage', changed)
            clearInterval(interval)
            clearTimeout(notice)
            if (bridge.current === active) bridge.current = null
        }
    }, [accountId, frameRef, onWallet, generation])

    const finish = useCallback(async () => { await bridge.current?.finish() }, [])
    const discardPending = useCallback(async () => {
        if (!window.confirm('Se descartarán los cambios pendientes de este navegador y se cargará la partida de la cuenta. ¿Continuar?')) return
        try {
            await gamePendingStore.remove(String(accountId))
            setConnection({ status: 'waiting', message: 'Volviendo a cargar la partida de la cuenta…' })
            setGeneration(value => value + 1)
        } catch { setConnection(current => ({ ...current, message: 'No se pudieron descartar los cambios pendientes.' })) }
    }, [accountId])
    return { connection, finish, discardPending, generation }
}
