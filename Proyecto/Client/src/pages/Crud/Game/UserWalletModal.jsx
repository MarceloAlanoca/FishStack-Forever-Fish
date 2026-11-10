import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import CrudModal from '../CrudModal'
import { API_URL } from '../../../config/api'

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
const number = value => new Intl.NumberFormat('es-AR').format(value)

export default function UserWalletModal({ target, onClose, onSaved }) {
    const [wallet, setWallet] = useState(null)
    const [balance, setBalance] = useState('')
    const [reason, setReason] = useState('')
    const [rows, setRows] = useState([])
    const [cursor, setCursor] = useState(null)
    const [busy, setBusy] = useState(false)
    const [loading, setLoading] = useState(true)
    const [uncertain, setUncertain] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [refresh, setRefresh] = useState(0)
    const attempt = useRef(null)
    const submitting = useRef(false)
    const url = `${API_URL}/admin/users/${target.ID_Usuario}/balance`

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${url}/movements`, { ...config(), signal: controller.signal }).then(({ data }) => {
            setWallet(data.wallet)
            setBalance(String(data.wallet.balance))
            setRows(data.movements)
            setCursor(data.nextCursor)
        }).catch(error => {
            if (!controller.signal.aborted) setError(error.response?.data?.message || 'No se pudo cargar el saldo.')
        }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [url, refresh])

    async function save(event) {
        event.preventDefault()
        if (submitting.current || !wallet) return
        if (!attempt.current) {
            const value = Number(balance)
            if (!/^\d+$/.test(balance) || !Number.isSafeInteger(value) || value < 0 || value > 2147483647 || !reason.trim()) {
                setError('Ingresa un saldo entero válido y el motivo del ajuste.')
                return
            }
            attempt.current = { requestId: crypto.randomUUID(), expectedRevision: wallet.revision, balance: value, reason: reason.trim() }
        }
        submitting.current = true
        setBusy(true)
        setError('')
        setNotice('')
        try {
            const { data } = await axios.patch(url, attempt.current, { ...config(), timeout: 15000 })
            attempt.current = null
            setUncertain(false)
            setWallet(data.wallet)
            setBalance(String(data.wallet.balance))
            setReason('')
            setNotice('Saldo actualizado. El ajuste quedó registrado en el historial.')
            onSaved(data.wallet)
            setRefresh(value => value + 1)
        } catch (error) {
            const status = error.response?.status
            if (status >= 400 && status < 500) { attempt.current = null; setUncertain(false) }
            else setUncertain(true)
            setError(error.response?.data?.message || 'No se pudo confirmar el ajuste. Reintenta con la misma referencia.')
        } finally { submitting.current = false; setBusy(false) }
    }

    async function more() {
        setBusy(true)
        setError('')
        try {
            const { data } = await axios.get(`${url}/movements`, { ...config(), params: { before: cursor } })
            setRows(current => [...current, ...data.movements])
            setCursor(data.nextCursor)
        } catch (error) { setError(error.response?.data?.message || 'No se pudo cargar el historial.') }
        finally { setBusy(false) }
    }

    return <CrudModal title={`Doblones de ${target.Usuario}`} busy={busy} error={error} onClose={onClose}>
        {loading && <p role="status">Cargando saldo e historial…</p>}
        {wallet && <>
            <p className="crud-wallet-balance">Saldo actual: <strong>{number(wallet.balance)}</strong> doblones · Revisión {wallet.revision}</p>
            {notice && <p className="crud-feedback" role="status">{notice}</p>}
            {uncertain && <p role="status">El resultado está pendiente de confirmar. Reintenta antes de cambiar los datos.</p>}
            <form className="crud-record-form" onSubmit={save}>
                <fieldset disabled={busy || loading}>
                    <label>Nuevo saldo<input type="number" min="0" max="2147483647" step="1" required value={balance}
                        disabled={uncertain} onChange={event => setBalance(event.target.value)} /></label>
                    <label>Motivo del ajuste<textarea maxLength={240} rows={2} required value={reason}
                        disabled={uncertain} onChange={event => setReason(event.target.value)} /></label>
                    <div className="crud-form-actions">
                        <button type="submit">{busy ? 'Guardando…' : uncertain ? 'Reintentar confirmación' : 'Guardar saldo'}</button>
                    </div>
                </fieldset>
            </form>
            <h3>Movimientos de doblones</h3>
            {rows.length === 0 && <p>Todavía no hay movimientos registrados.</p>}
            {rows.length > 0 && <div className="crud-table-scroll" tabIndex="0" role="region" aria-label="Historial de doblones">
                <table className="crud-table">
                    <thead><tr><th>Fecha</th><th>Cambio</th><th>Saldo</th><th>Motivo</th><th>Responsable</th></tr></thead>
                    <tbody>{rows.map(row => <tr key={row.id}>
                        <td>{new Date(row.createdAt).toLocaleString('es-AR')}</td>
                        <td>{row.delta > 0 ? '+' : ''}{number(row.delta)}</td>
                        <td>{number(row.balanceAfter)}</td><td>{row.reason}</td>
                        <td>{row.actorId ? `Administrador #${row.actorId}` : row.kind === 'shop' ? 'Tienda' : row.kind === 'mission' ? 'Misiones' : row.kind}</td>
                    </tr>)}</tbody>
                </table>
            </div>}
            {cursor && <button type="button" disabled={busy} onClick={more}>Ver más movimientos</button>}
        </>}
        <button type="button" disabled={busy || uncertain} onClick={() => {
            setLoading(true); setError(''); setRefresh(value => value + 1)
        }}>Actualizar saldo e historial</button>
    </CrudModal>
}
