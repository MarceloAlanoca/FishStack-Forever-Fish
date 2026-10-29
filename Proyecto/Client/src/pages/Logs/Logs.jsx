import { useEffect, useRef, useState } from "react"
import axios from "axios"
import Header from "../../components/Header/Header"
import { API_URL } from "../../config/api"
import "./Logs.css"

function fechaPublicacion(fecha) {
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires"
    }).format(new Date(fecha))
}

function UpdateDetail({ id, onClose }) {
    const dialog = useRef(null)
    const [update, setUpdate] = useState(null)
    const [error, setError] = useState("")
    const [retry, setRetry] = useState(0)

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

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${API_URL}/updates/${id}`, { signal: controller.signal })
            .then(({ data }) => setUpdate(data))
            .catch((error) => {
                if (!controller.signal.aborted) setError(error.response?.data?.message || "No se pudo conectar con el servidor.")
            })
        return () => controller.abort()
    }, [id, retry])

    return (
        <dialog className="logs-detail" ref={dialog} onCancel={(event) => { event.preventDefault(); onClose() }}
            onClick={(event) => { if (event.target === event.currentTarget) onClose() }} aria-labelledby="logs-detail-title">
            <div className="logs-detail__header">
                <div>
                    <h2 id="logs-detail-title">{update?.Nombre || "Detalle de la actualización"}</h2>
                    {update && <p>Versión {update.Version} · {fechaPublicacion(update.Fecha)}</p>}
                </div>
                <button type="button" className="logs-detail__close" onClick={onClose} aria-label="Cerrar actualización" autoFocus>×</button>
            </div>
            <div className="logs-detail__body">
                {!update && !error && <p role="status">Cargando actualización...</p>}
                {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setRetry((value) => value + 1) }}>Reintentar</button></div>}
                {update?.Imagen && <img className="logs-detail__image" src={API_URL + update.Imagen} alt={update.Nombre} />}
                {update && <p className="logs-detail__text">{update.Detalle}</p>}
            </div>
        </dialog>
    )
}

export default function Logs() {
    const [updates, setUpdates] = useState([])
    const [estado, setEstado] = useState("loading")
    const [retry, setRetry] = useState(0)
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${API_URL}/updates`, { signal: controller.signal })
            .then(({ data }) => { setUpdates(data); setEstado("ready") })
            .catch(() => { if (!controller.signal.aborted) setEstado("error") })
        return () => controller.abort()
    }, [retry])

    return (
        <div className="logs-page">
            <Header />
            <main className="logs-content">
                <section className="logs-intro">
                    <h1>Actualizaciones</h1>
                </section>
                <section className="logs-list" aria-label="Registro de actualizaciones" aria-busy={estado === "loading"}>
                    {estado === "loading" && <p className="logs-state" role="status">Cargando actualizaciones...</p>}
                    {estado === "error" && <div className="logs-state" role="alert">
                        <p>No pudimos cargar las actualizaciones. Comprueba la conexión e intenta nuevamente.</p>
                        <button type="button" onClick={() => { setEstado("loading"); setRetry((value) => value + 1) }}>Reintentar</button>
                    </div>}
                    {estado === "ready" && updates.length === 0 && <p className="logs-state">Todavía no hay actualizaciones publicadas.</p>}
                    {estado === "ready" && updates.map((update) => <article className="logs-entry" key={update.ID_Update}>
                        <button type="button" className="logs-entry__open" onClick={() => setSelected(update.ID_Update)} aria-haspopup="dialog">
                            <span className="logs-entry__meta"><span className="logs-version">v{update.Version}</span><span>{update.Tipo}</span><time dateTime={update.Fecha}>{fechaPublicacion(update.Fecha)}</time></span>
                            {update.Imagen && <img className="logs-entry__image" src={API_URL + update.Imagen} alt="" loading="lazy" />}
                            <h2>{update.Nombre}</h2>
                            <p>{update.Descripcion_Inicial}</p>
                            <span className="logs-entry__read">Leer actualización <span aria-hidden="true">→</span></span>
                        </button>
                    </article>)}
                </section>
            </main>
            <footer className="logs-footer">FishStack: Forever Fish · DevPlay Studio</footer>
            {selected !== null && <UpdateDetail key={selected} id={selected} onClose={() => setSelected(null)} />}
        </div>
    )
}
