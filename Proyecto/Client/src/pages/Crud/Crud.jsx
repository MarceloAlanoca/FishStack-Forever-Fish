import { useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import axios from "axios"
import Header from "../../components/Header/Header"
import { API_URL } from "../../config/api"
import "./Crud.css"

const secciones = [
    { numero: "01", nombre: "Usuarios", texto: "Cuentas y roles de la comunidad." },
    { numero: "02", nombre: "Artículos", texto: "Productos y contenido de la tienda." },
    { numero: "03", nombre: "Peces", texto: "Catálogo de peces de FishStack." }
]

export default function Crud() {
    const [estado, setEstado] = useState("loading")
    const [usuario, setUsuario] = useState(null)
    useEffect(() => {
        const controller = new AbortController()
        axios.get(API_URL + "/admin", {
            headers: { Authorization: "Bearer " + localStorage.getItem("token") },
            signal: controller.signal
        }).then(({ data }) => {
            setUsuario(data.usuario)
            setEstado("ready")
        }).catch((error) => {
            if (controller.signal.aborted) return
            const status = error.response?.status
            setEstado(status === 401 ? "unauthorized" : status === 403 ? "forbidden" : "error")
        })
        return () => controller.abort()
    }, [])
    if (estado === "unauthorized") return <Navigate to="/login" replace />
    return (
        <div className="crud-page">
            <Header theme="slate" usuario={usuario} />
            <main className="crud-content">
                {estado === "loading" && <p role="status">Comprobando acceso...</p>}
                {estado === "forbidden" && <section className="crud-message" role="alert">
                    <h1>Acceso restringido</h1><p>Esta página está disponible solo para administradores.</p>
                    <Link to="/home">Volver al inicio</Link>
                </section>}
                {estado === "error" && <section className="crud-message" role="alert">
                    <h1>No pudimos verificar tu acceso</h1><p>Comprueba la conexión e intenta nuevamente.</p>
                    <button type="button" onClick={() => window.location.reload()}>Reintentar</button>
                </section>}
                {estado === "ready" && <>
                    <section className="crud-intro">
                        <span className="crud-eyebrow">FISHSTACK / ADMINISTRACIÓN</span>
                        <h1>CRUD</h1><p>Un espacio para administrar FishStack: Forever Fish.</p>
                        <div className="crud-session"><span className="crud-session__dot" />{usuario.Usuario}<span>Administrador</span></div>
                    </section>
                    <section className="crud-modules" aria-labelledby="crud-modules-title">
                        <div className="crud-section-title"><h2 id="crud-modules-title">Panel de gestión</h2><span>PRÓXIMAMENTE</span></div>
                        <div className="crud-grid">
                            {secciones.map((seccion) => <article className="crud-card" key={seccion.numero}>
                                <span className="crud-card__number">{seccion.numero}</span>
                                <h3>{seccion.nombre}</h3><p>{seccion.texto}</p>
                                <span className="crud-card__status">En preparación</span>
                            </article>)}
                        </div>
                        <p className="crud-note">Las herramientas para crear, consultar, modificar y eliminar contenido se añadirán aquí.</p>
                    </section>
                </>}
            </main>
            <footer className="crud-footer"><span>FishStack: Forever Fish</span><span>DevPlay Studio</span></footer>
        </div>
    )
}
