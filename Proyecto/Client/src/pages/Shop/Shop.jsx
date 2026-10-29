import { useEffect, useRef, useState } from "react"
import axios from "axios"
import Header from "../../components/Header/Header"
import { API_URL } from "../../config/api"
import "./Shop.css"

function formatPrice(price) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(price)
}

function ArticleDetail({ article, onClose }) {
    const dialog = useRef(null)

    useEffect(() => {
        const element = dialog.current
        element.showModal()
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            element.close()
            document.body.style.overflow = previousOverflow
        }
    }, [])

    return (
        <dialog
            ref={dialog}
            className="shop-detail"
            aria-labelledby="shop-detail-title"
            onCancel={(event) => {
                event.preventDefault()
                onClose()
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <button type="button" className="shop-back" onClick={onClose} autoFocus>
                Volver
            </button>
            <div className="shop-detail-content">
                <div className="shop-detail-picture" aria-hidden="true">
                    <span className="shop-coin">D</span>
                    <strong>{article.Doblones}</strong>
                    <span>doblones</span>
                </div>
                <div className="shop-detail-info">
                    <h2 id="shop-detail-title">{article.Nombre}</h2>
                    <span className="shop-type">{article.Tipo}</span>
                    <p>{article.Descripcion}</p>
                    <p className="shop-price">{formatPrice(article.Precio)} ARS</p>
                    <button type="button" className="shop-buy" disabled>
                        Comprar
                    </button>
                </div>
            </div>
        </dialog>
    )
}

export default function Shop() {
    const [articles, setArticles] = useState([])
    const [status, setStatus] = useState("loading")
    const [retry, setRetry] = useState(0)
    const [type, setType] = useState("")
    const [priceOrder, setPriceOrder] = useState("")
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        const controller = new AbortController()
        axios.get(API_URL + "/articles", { signal: controller.signal })
            .then(({ data }) => {
                setArticles(data)
                setStatus("ready")
            })
            .catch(() => {
                if (!controller.signal.aborted) setStatus("error")
            })
        return () => controller.abort()
    }, [retry])

    const types = []
    for (let i = 0; i < articles.length; i++) {
        if (!types.includes(articles[i].Tipo)) types.push(articles[i].Tipo)
    }

    let visibleArticles = articles.filter((article) => type === "" || article.Tipo === type)
    if (priceOrder === "asc") {
        visibleArticles.sort((a, b) => a.Precio - b.Precio)
    } else if (priceOrder === "desc") {
        visibleArticles.sort((a, b) => b.Precio - a.Precio)
    }

    return (
        <div className="shop-page">
            <Header />
            <main className="shop-content">
                <section className="shop-welcome">
                    <h1>Tienda de FishStack</h1>
                    <p>Encuentra paquetes de doblones para tu aventura en FishStack: Forever Fish.</p>
                    <p className="shop-help">Precios en pesos argentinos.</p>
                </section>

                <div className="shop-filters">
                    <label>
                        Tipo
                        <select value={type} onChange={(event) => setType(event.target.value)}>
                            <option value="">Todos los tipos</option>
                            {types.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label>
                        Precio
                        <select value={priceOrder} onChange={(event) => setPriceOrder(event.target.value)}>
                            <option value="">Sin ordenar precio</option>
                            <option value="asc">Menor a mayor</option>
                            <option value="desc">Mayor a menor</option>
                        </select>
                    </label>
                </div>

                <section className="shop-catalog" aria-labelledby="shop-catalog-title" aria-busy={status === "loading"}>
                    <h2 id="shop-catalog-title">Artículos disponibles</h2>
                    {status === "loading" && <p role="status">Cargando artículos...</p>}
                    {status === "error" && (
                        <div className="shop-state" role="alert">
                            <p>No se pudieron cargar los artículos. Comprueba la conexión e intenta nuevamente.</p>
                            <button type="button" onClick={() => {
                                setStatus("loading")
                                setRetry(retry + 1)
                            }}>Reintentar</button>
                        </div>
                    )}
                    {status === "ready" && visibleArticles.length === 0 && <p>No hay artículos disponibles.</p>}
                    {status === "ready" && visibleArticles.map((article) => (
                        <article key={article.ID_Pass} className="shop-item">
                            <div className="shop-item-picture" aria-hidden="true">
                                <span className="shop-coin">D</span>
                                <strong>{article.Doblones}</strong>
                            </div>
                            <div className="shop-item-info">
                                <h3>{article.Nombre}</h3>
                                <span className="shop-type">{article.Tipo}</span>
                                <p>Precio: <strong className="shop-price">{formatPrice(article.Precio)} ARS</strong></p>
                                <button type="button" onClick={() => setSelected(article)} aria-haspopup="dialog">
                                    Ver pase
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </main>
            {selected && <ArticleDetail article={selected} onClose={() => setSelected(null)} />}
        </div>
    )
}
