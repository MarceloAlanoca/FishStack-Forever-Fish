import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import axios from "axios"
import Header from "../../components/Header/Header"
import useCurrentUser from "../../hooks/useCurrentUser"
import { API_URL } from "../../config/api"
import "./Shop.css"

const demoCards = { approved: "4242424242424242", declined: "4000000000000002" }
const price = value => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value)

export default function Checkout() {
    const { id } = useParams()
    const { usuario, setUsuario } = useCurrentUser()
    const [article, setArticle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [busy, setBusy] = useState(false)
    const [receipt, setReceipt] = useState(null)
    const [form, setForm] = useState({ holder: "", card: "", expiry: "", cvc: "" })
    const attempt = useRef(null)
    const submitting = useRef(false)

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${API_URL}/articles`, { signal: controller.signal }).then(({ data }) => {
            const selected = data.find(item => String(item.ID_Pass) === id)
            if (!selected) throw new Error("El paquete ya no está disponible.")
            setArticle(selected)
        }).catch(error => {
            if (!controller.signal.aborted) setError(error.response?.data?.message || "No se pudo cargar el paquete. Vuelve a la tienda e inténtalo nuevamente.")
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false)
        })
        return () => controller.abort()
    }, [id])

    function change(event) {
        setForm(previous => ({ ...previous, [event.target.name]: event.target.value }))
        setError("")
    }

    async function submit(event) {
        event.preventDefault()
        if (submitting.current || receipt || !article) return
        const card = form.card.replace(/\s/g, "")
        const outcome = Object.keys(demoCards).find(key => demoCards[key] === card)
        const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(form.expiry)
        const now = new Date()
        if (!form.holder.trim() || !outcome || form.cvc !== "123" || !match ||
            new Date(2000 + Number(match[2]), Number(match[1])) <= now) {
            setError("Usa una tarjeta de prueba indicada, un titular ficticio, vencimiento futuro MM/AA y código 123.")
            return
        }
        // La referencia se conserva ante errores de red para que un reintento no duplique el saldo.
        if (attempt.current && attempt.current.outcome !== outcome) {
            setError("Reintenta con la misma tarjeta para confirmar la operación pendiente.")
            return
        }
        if (!attempt.current) attempt.current = { requestId: crypto.randomUUID(), outcome }
        submitting.current = true
        setBusy(true)
        setError("")
        try {
            // Los campos de tarjeta y titular se quedan en memoria en esta página.
            const { data } = await axios.post(`${API_URL}/purchases/simulate`, {
                ...attempt.current, articleId: article.ID_Pass,
                expectedPrice: article.Precio, expectedCoins: article.Doblones
            }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, timeout: 15000 })
            setReceipt(data)
            setForm({ holder: "", card: "", expiry: "", cvc: "" })
            setUsuario(previous => previous ? { ...previous, Doblones: data.balance } : previous)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo confirmar la operación. Reintenta; no se duplicarán los doblones.")
        } finally {
            submitting.current = false
            setBusy(false)
        }
    }

    return <div className="shop-page">
        <Header usuario={usuario} />
        <main className="shop-content">
            <Link to="/shop">← Volver a la tienda</Link>
            <section className="shop-welcome checkout-intro">
                <h1>Compra de doblones</h1>
                <p><strong>Simulador de pago · No se realizan cobros.</strong></p>
                <p>Usa únicamente datos ficticios. Los doblones de prueba se sumarán al saldo de tu cuenta.</p>
            </section>
            {loading && <p role="status">Cargando paquete…</p>}
            {error && <p className="checkout-error" role="alert">{error}</p>}
            {article && !receipt && <div className="checkout-grid">
                <section className="shop-catalog">
                    <h2>Tu paquete</h2>
                    <span className="shop-coin" aria-hidden="true">D</span>
                    <h3>{article.Nombre}</h3><p>{article.Descripcion}</p>
                    <p>{article.Doblones} doblones</p>
                    <p>Total simulado: <strong className="shop-price">{price(article.Precio)}</strong></p>
                    <p>No se descontará dinero de ninguna cuenta.</p>
                </section>
                <form className="shop-catalog checkout-form" onSubmit={submit} autoComplete="off">
                    <h2>Datos de prueba</h2>
                    <p id="demo-help">Aprobada: 4242 4242 4242 4242<br />Rechazada: 4000 0000 0000 0002<br />Vencimiento futuro y código 123.</p>
                    <fieldset disabled={busy}>
                        <button type="button" className="shop-back" onClick={() => {
                            const future = String(new Date().getFullYear() + 1).slice(-2)
                            setForm({ holder: "Marinero de prueba", card: "4242 4242 4242 4242", expiry: `12/${future}`, cvc: "123" })
                        }}>Rellenar ejemplo aprobado</button>
                        <label>Titular ficticio<input name="holder" value={form.holder} onChange={change} maxLength={80} required /></label>
                        <label>Tarjeta de prueba<input name="card" value={form.card} onChange={change} inputMode="numeric" maxLength={19} aria-describedby="demo-help" required /></label>
                        <div className="checkout-row">
                            <label>Vencimiento (MM/AA)<input name="expiry" value={form.expiry} onChange={change} placeholder="MM/AA" maxLength={5} required /></label>
                            <label>Código de prueba<input name="cvc" type="password" value={form.cvc} onChange={change} inputMode="numeric" maxLength={3} required /></label>
                        </div>
                        <button type="submit" className="shop-buy" disabled={busy}>{busy ? "Procesando simulación…" : "Confirmar compra simulada"}</button>
                    </fieldset>
                </form>
            </div>}
            {receipt && <section className="shop-catalog checkout-receipt" role="status">
                <h2>{receipt.status === "approved" ? "¡Simulación aprobada!" : "Pago de prueba rechazado"}</h2>
                <p>{receipt.status === "approved" ? `Se acreditaron ${receipt.coins} doblones de prueba.` : "No se acreditaron doblones. No se realizó ningún cobro."}</p>
                <p>Saldo: <strong>{receipt.balance} doblones</strong></p>
                <p className="checkout-reference">Referencia: {receipt.reference}</p>
                <p>Esta operación es una demostración, sin valor monetario.</p>
                <Link to="/shop">Volver a la tienda</Link>
                {receipt.status === "declined" && <button className="shop-back" type="button" onClick={() => {
                    attempt.current = null
                    setReceipt(null)
                }}>Probar otra vez</button>}
            </section>}
        </main>
    </div>
}
