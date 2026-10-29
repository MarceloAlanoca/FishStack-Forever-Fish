import { useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import axios from "axios"
import Header from "../../components/Header/Header"
import { API_URL } from "../../config/api"
import UserManager from "./UserManager"
import ArticleManager from "./ArticleManager"
import UpdateManager from "./UpdateManager"
import CreditManager from "./CreditManager"
import "./Crud.css"

export default function Crud() {
    const [estado, setEstado] = useState("loading")
    const [usuario, setUsuario] = useState(null)
    const [section, setSection] = useState("users")
    const [creditsOpen, setCreditsOpen] = useState(false)
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
                        <h1>CRUD</h1>
                        <div className="crud-session"><span className="crud-session__dot" />{usuario.Usuario}<span>Administrador</span></div>
                    </section>
                    <div className="crud-workspace">
                        <nav className="crud-sidebar" aria-label="Secciones de administración">
                            <h2>Administrar</h2>
                            <button
                                type="button"
                                className={section === "users" ? "crud-sidebar-active" : ""}
                                aria-current={section === "users" ? "page" : undefined}
                                onClick={() => setSection("users")}
                            >
                                Usuarios
                            </button>
                            <button
                                type="button"
                                className={section === "articles" ? "crud-sidebar-active" : ""}
                                aria-current={section === "articles" ? "page" : undefined}
                                onClick={() => setSection("articles")}
                            >
                                Artículos
                            </button>
                            <button
                                type="button"
                                className={section === "updates" ? "crud-sidebar-active" : ""}
                                aria-current={section === "updates" ? "page" : undefined}
                                onClick={() => setSection("updates")}
                            >
                                Actualizaciones
                            </button>
                            <button type="button" aria-expanded={creditsOpen} aria-controls="crud-credits-menu"
                                onClick={() => setCreditsOpen(!creditsOpen)}>
                                Créditos <span aria-hidden="true">{creditsOpen ? "▴" : "▾"}</span>
                            </button>
                            {creditsOpen && <div id="crud-credits-menu" className="crud-sidebar-submenu">
                                <button type="button" className={section === "integrantes" ? "crud-sidebar-active" : ""}
                                    aria-current={section === "integrantes" ? "page" : undefined} onClick={() => setSection("integrantes")}>Integrantes</button>
                                <button type="button" className={section === "inspiraciones" ? "crud-sidebar-active" : ""}
                                    aria-current={section === "inspiraciones" ? "page" : undefined} onClick={() => setSection("inspiraciones")}>Inspiraciones</button>
                            </div>}
                        </nav>
                        {section === "users" && <UserManager currentUser={usuario} onCurrentUserChange={setUsuario} />}
                        {section === "articles" && <ArticleManager />}
                        {section === "updates" && <UpdateManager />}
                        {(section === "integrantes" || section === "inspiraciones") && <CreditManager key={section} type={section} />}
                    </div>
                </>}
            </main>
            <footer className="crud-footer"><span>FishStack: Forever Fish</span><span>DevPlay Studio</span></footer>
        </div>
    )
}
