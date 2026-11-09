import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import Header from '../../components/Header/Header'
import DoblonAmount from './DoblonAmount'
import useCurrentUser from '../../hooks/useCurrentUser'
import { API_URL } from '../../config/api'
import { demoCards, formatCard, formatExpiry, validatePayment } from './paymentValidation'
import './Shop.css'

const price = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

function FieldError({ name, message }) {
    return message ? <small className="checkout-field-error" id={`checkout-${name}-error`}>{message}</small> : null
}

export default function Checkout() {
    const { id } = useParams()
    const { usuario, setUsuario } = useCurrentUser()
    const isAdmin = usuario?.Rol?.toLowerCase() === 'administrador'
    const [article, setArticle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})
    const [pendingAttempt, setPendingAttempt] = useState(false)
    const [busy, setBusy] = useState(false)
    const [receipt, setReceipt] = useState(null)
    const [form, setForm] = useState({ holder: '', card: '', expiry: '', cvc: '' })
    const attempt = useRef(null)
    const submitting = useRef(false)

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${API_URL}/articles`, { signal: controller.signal }).then(({ data }) => {
            const selected = data.find(item => String(item.ID_Pass) === id)
            if (!selected) throw new Error('El paquete ya no está disponible.')
            setArticle(selected)
        }).catch(error => {
            if (!controller.signal.aborted) setError(error.response?.data?.message || 'No se pudo cargar el paquete. Vuelve a la tienda e inténtalo nuevamente.')
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false)
        })
        return () => controller.abort()
    }, [id])

    function change(event) {
        const { name, value } = event.target
        const formatted = name === 'card' ? formatCard(value) : name === 'expiry' ? formatExpiry(value)
            : name === 'cvc' ? value.replace(/\D/g, '').slice(0, 3) : value
        setForm(previous => ({ ...previous, [name]: formatted }))
        setFieldErrors(previous => ({ ...previous, [name]: undefined }))
        setError('')
    }

    function blur(event) {
        const name = event.target.name
        setFieldErrors(previous => ({ ...previous, [name]: validatePayment(form, new Date(), { isAdmin })[name] }))
    }

    function fillExample(type) {
        if (!isAdmin || pendingAttempt || busy) return
        const future = String(new Date().getFullYear() + 1).slice(-2)
        setForm({ holder: 'Marinero del puerto', card: formatCard(demoCards[type]), expiry: `12/${future}`, cvc: '123' })
        setFieldErrors({})
        setError('')
    }

    async function submit(event) {
        event.preventDefault()
        if (submitting.current || receipt || !article || !usuario) return
        if (!attempt.current) {
            const errors = validatePayment(form, new Date(), { isAdmin })
            setFieldErrors(errors)
            if (Object.keys(errors).length) {
                setError('Revisa los campos señalados antes de confirmar.')
                document.getElementById(`checkout-${Object.keys(errors)[0]}`)?.focus()
                return
            }
            // Conserva la solicitud completa en memoria para reintentar exactamente la misma operación.
            attempt.current = {
                requestId: crypto.randomUUID(), articleId: article.ID_Pass,
                expectedPrice: article.Precio, expectedCoins: article.Doblones,
                payment: { ...form, holder: form.holder.trim(), card: form.card.replace(/ /g, '') }
            }
        }
        submitting.current = true
        setBusy(true)
        setError('')
        try {
            // El servidor comprueba el rol y decide el resultado de la simulación.
            const { data } = await axios.post(`${API_URL}/purchases/simulate`, attempt.current,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, timeout: 15000 })
            setReceipt(data)
            attempt.current = null
            setPendingAttempt(false)
            setForm({ holder: '', card: '', expiry: '', cvc: '' })
            setUsuario(previous => previous ? { ...previous, Doblones: data.balance } : previous)
        } catch (error) {
            const status = error.response?.status
            if (status >= 400 && status < 500) {
                // El servidor no creó una compra y permite corregir los campos.
                attempt.current = null
                setPendingAttempt(false)
                setFieldErrors(error.response?.data?.errors || {})
            } else {
                // Con un corte de red la compra podría haberse confirmado; conserva la referencia.
                setPendingAttempt(true)
            }
            setError(error.response?.data?.message || 'No se pudo confirmar la operación. Reintenta; no se duplicarán los doblones.')
        } finally {
            submitting.current = false
            setBusy(false)
        }
    }

    return <div className="shop-page checkout-page">
        <Header usuario={usuario} />
        <main className="shop-content">
            <Link className="shop-back checkout-return" to="/shop">&larr; Volver a la tienda</Link>
            <div className="checkout-frame">
            <section className="shop-welcome checkout-intro">
                <h1>Compra de doblones</h1>
            </section>
            {loading && <p role="status">Cargando paquete…</p>}
            {error && <p className="checkout-error" role="alert">{error}</p>}
            {article && !receipt && <div className="checkout-grid">
                <section className="shop-catalog checkout-summary">
                    <h2>Tu paquete</h2>
                    <DoblonAmount amount={article.Doblones} large />
                    <h3>{article.Nombre}</h3><p>{article.Descripcion}</p>
                    <p>Total: <strong className="shop-price">{price(article.Precio)}</strong></p>
                </section>
                <form className="shop-catalog checkout-form" onSubmit={submit} autoComplete="off" noValidate>
                    <h2>Datos de la tarjeta</h2>
                    {pendingAttempt && <p className="checkout-pending" role="status">Hay una operación pendiente de confirmar. Reintenta con los mismos datos; no se duplicarán los doblones.</p>}
                    <fieldset disabled={busy || !usuario}>
                        {isAdmin && <div className="checkout-examples" role="group" aria-label="Ejemplos de compra">
                            <button type="button" className="shop-back" disabled={pendingAttempt} onClick={() => fillExample('approved')}>Ejemplo aprobado</button>
                            <button type="button" className="shop-back" disabled={pendingAttempt} onClick={() => fillExample('declined')}>Ejemplo rechazado</button>
                        </div>}
                        <label>Titular<input id="checkout-holder" name="holder" value={form.holder} onChange={change} onBlur={blur} maxLength={80}
                            disabled={pendingAttempt} aria-invalid={Boolean(fieldErrors.holder)} aria-describedby={fieldErrors.holder ? 'checkout-holder-error' : undefined} required />
                            <FieldError name="holder" message={fieldErrors.holder} /></label>
                        <label>Número de tarjeta<input id="checkout-card" name="card" value={form.card} onChange={change} onBlur={blur} inputMode="numeric" maxLength={19}
                            placeholder="4242 4242 4242 4242" disabled={pendingAttempt} aria-invalid={Boolean(fieldErrors.card)}
                            aria-describedby={fieldErrors.card ? 'checkout-card-error' : undefined} required />
                            <FieldError name="card" message={fieldErrors.card} /></label>
                        <div className="checkout-row">
                            <label>Vencimiento (MM/AA)<input id="checkout-expiry" name="expiry" value={form.expiry} onChange={change} onBlur={blur} inputMode="numeric"
                                placeholder="MM/AA" maxLength={5} disabled={pendingAttempt} aria-invalid={Boolean(fieldErrors.expiry)}
                                aria-describedby={fieldErrors.expiry ? 'checkout-expiry-error' : undefined} required />
                                <FieldError name="expiry" message={fieldErrors.expiry} /></label>
                            <label>CVV<input id="checkout-cvc" name="cvc" type="password" value={form.cvc} onChange={change} onBlur={blur} inputMode="numeric" maxLength={3}
                                disabled={pendingAttempt} aria-invalid={Boolean(fieldErrors.cvc)} aria-describedby={fieldErrors.cvc ? 'checkout-cvc-error' : undefined} required />
                                <FieldError name="cvc" message={fieldErrors.cvc} /></label>
                        </div>
                        <button type="submit" className="shop-buy" disabled={busy}>{busy ? 'Procesando compra…' : pendingAttempt ? 'Reintentar confirmación' : 'Confirmar compra'}</button>
                    </fieldset>
                </form>
            </div>}
            {receipt && <section className="shop-catalog checkout-receipt" role="status">
                <h2>{receipt.status === 'approved' ? '¡Compra aprobada!' : 'Pago rechazado'}</h2>
                <p>{receipt.message}</p>
                <p>{receipt.status === 'approved' ? <>Se acreditaron <DoblonAmount amount={receipt.coins} />.</> : 'No se acreditaron doblones.'}</p>
                <p>Saldo: <DoblonAmount amount={receipt.balance} /></p>
                <p className="checkout-reference">Referencia: {receipt.reference}</p>
                <Link className="shop-back checkout-return" to="/shop">Volver a la tienda</Link>
                {receipt.status === 'declined' && <button className="shop-back" type="button" onClick={() => {
                    attempt.current = null
                    setReceipt(null)
                }}>Intentar otra vez</button>}
            </section>}
            </div>
        </main>
    </div>
}
