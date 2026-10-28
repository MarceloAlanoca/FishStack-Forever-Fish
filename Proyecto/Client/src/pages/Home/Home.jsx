import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

import { API_URL } from "../../config/api"
import Header from "../../components/Header/Header"
import NetworksModal from "./NetworksModal"
import "./Home.css"

const anuncios = [
    { titulo: "Drink SUS", imagen: "/images/Ads/SusAd.png", url: "https://www.innersloth.com/games/among-us/" },
    { titulo: "CGR Corp", imagen: "/images/Ads/CGR_Corp.png", url: "https://www.corpgovrisk.com/" },
    { titulo: "Panchito", imagen: "/images/Ads/Panchito.png", url: "https://chisap.com/shop/panchos" }
]

const frases = [
    "Todo gran pescador empezo con una caña sencilla.",
    "El oceano guarda historias para quien se anima a explorarlo.",
    "Una captura mas puede cambiar toda la aventura."
]

const accesosDirectorio = [
    {
        nombre: "Perfil",
        descripcion: "Progreso y peces",
        icono: "★"
    },
    {
        nombre: "Creditos",
        descripcion: "Conoce al equipo",
        icono: "◆"
    },
    {
        nombre: "Redes",
        descripcion: "Nuestra comunidad",
        icono: "@"
    }
]

const anuncioInicial = Math.floor(Math.random() * anuncios.length)
const fraseInicial = frases[Math.floor(Math.random() * frases.length)]

function Home() {
    const navigate = useNavigate()

    const [usuario, setUsuario] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [anuncioActual, setAnuncioActual] = useState(anuncioInicial)
    const [direccionAnuncio, setDireccionAnuncio] = useState("siguiente")
    const [reinicioAnuncio, setReinicioAnuncio] = useState(0)
    const [accesoActual, setAccesoActual] = useState(0)
    const [reinicioAcceso, setReinicioAcceso] = useState(0)
    const [frase] = useState(fraseInicial)
    const [mostrarActividad, setMostrarActividad] = useState(true)
    const activityDrag = useRef(null)
    const [mostrarRedes, setMostrarRedes] = useState(false)

    useEffect(() => {
        const verificarUsuario = async () => {
            const token = localStorage.getItem("token")

            try {
                const respuesta = await axios.get(`${API_URL}/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                setUsuario(respuesta.data)
            } catch (error) {
                console.log(error)
                localStorage.removeItem("token")
                navigate("/login")
            } finally {
                setCargando(false)
            }
        }

        verificarUsuario()
    }, [navigate])

    useEffect(() => {
        const intervalo = setInterval(() => {
            setDireccionAnuncio("siguiente")
            // el resto de la division vuelve al primer anuncio, al llegar al final de la lista.
            setAnuncioActual((anterior) => (anterior + 1) % anuncios.length)
        }, 15000)

        return () => clearInterval(intervalo)
    }, [reinicioAnuncio])

    useEffect(() => {
        const intervalo = setInterval(() => {
            setAccesoActual((anterior) => (anterior + 1) % accesosDirectorio.length)
        }, 5000)

        return () => clearInterval(intervalo)
    }, [reinicioAcceso])

    const cambiarAnuncio = (nuevoAnuncio, direccion) => {
        setDireccionAnuncio(direccion)
        setAnuncioActual(nuevoAnuncio)
        // cambia la dependencia del efecto, para reiniciar el temporizador tras una seleccion manual.
        setReinicioAnuncio((valorActual) => valorActual + 1)
    }

    const moverFondo = (event) => {
        // centra la posicion del mouse y actualiza las variables css que desplazan el fondo.
        const movimientoX = (event.clientX / window.innerWidth - 0.5) * -18
        const movimientoY = (event.clientY / window.innerHeight - 0.5) * -12

        event.currentTarget.style.setProperty("--background-x", `${movimientoX}px`)
        event.currentTarget.style.setProperty("--background-y", `${movimientoY}px`)
    }

    const centrarFondo = (event) => {
        event.currentTarget.style.setProperty("--background-x", "0px")
        event.currentTarget.style.setProperty("--background-y", "0px")
    }

    if (cargando) {
        return (
            <main className="home-loading">
                <span className="home-loading__fish">&gt;&lt;&gt;</span>
                <p>Cargando el puerto...</p>
            </main>
        )
    }

    const anuncio = anuncios[anuncioActual]
    const acceso = accesosDirectorio[accesoActual]

    const interactuarConAcceso = () => {
        if (acceso.nombre === "Perfil") navigate("/profile")
        else if (acceso.nombre === "Creditos") navigate("/credits")
        else setMostrarRedes(true)
        setReinicioAcceso((valorActual) => valorActual + 1)
    }

    return (
        <main
            className="home-page"
            onMouseMove={moverFondo}
            onMouseLeave={centrarFondo}
        >
            <div className="home-ocean" aria-hidden="true">
                <span className="home-fish home-fish--one">&gt;&lt;&gt;</span>
                <span className="home-fish home-fish--two">&gt;&lt;&gt;</span>
                <span className="home-fish home-fish--three">&gt;&lt;&gt;</span>
                <span className="home-bubble home-bubble--one" />
                <span className="home-bubble home-bubble--two" />
                <span className="home-bubble home-bubble--three" />
            </div>

            <Header usuario={usuario} />

<section className="home-dashboard">
                <article className="home-panel home-ad">
                    <div className="home-panel__title">
                        <span>Anuncios</span>
                        <small>{anuncioActual + 1} / {anuncios.length}</small>
                    </div>

                    <div className="home-ad__viewport">
                        <div
                            className={`home-ad__slide home-ad--${direccionAnuncio}`}
                            key={`${anuncioActual}-${direccionAnuncio}-${reinicioAnuncio}`}
                        >
                            <a className="home-ad__link" href={anuncio.url} target="_blank" rel="noopener noreferrer"
                                aria-label={"Visitar " + anuncio.titulo + " (abre en otra pestaña)"}>
                                <img src={anuncio.imagen} alt={"Publicidad de " + anuncio.titulo} />
                            </a>
                            <button
                                className="home-ad__arrow home-ad__arrow--left"
                                type="button"
                                aria-label="Anuncio anterior"
                                onClick={() => cambiarAnuncio(
                                    (anuncioActual - 1 + anuncios.length) % anuncios.length,
                                    "anterior"
                                )}
                            >
                                ‹
                            </button>

                            <button
                                className="home-ad__arrow home-ad__arrow--right"
                                type="button"
                                aria-label="Siguiente anuncio"
                                onClick={() => cambiarAnuncio(
                                    (anuncioActual + 1) % anuncios.length,
                                    "siguiente"
                                )}
                            >
                                ›
                            </button>

                            <div className="home-ad__dots" aria-label="Selector de anuncios">
                                {anuncios.map((item, indice) => (
                                    <button
                                        className={indice === anuncioActual ? "activo" : ""}
                                        key={item.titulo}
                                        type="button"
                                        aria-label={`Ver anuncio ${indice + 1}`}
                                        onClick={() => cambiarAnuncio(
                                            indice,
                                            indice > anuncioActual ? "siguiente" : "anterior"
                                        )}
                                    />
                                ))}
                            </div>

                            <span className="home-change-timer home-change-timer--ad" />
                        </div>
                    </div>
                </article>

                <article className="home-panel home-directory">
                    <div className="home-panel__title">
                        <span>Directorio</span>
                        <small>ACCESO RAPIDO</small>
                    </div>

                    <blockquote>“{frase}”</blockquote>

                    <div className="home-actions">
                        <Link className="home-action home-action--play" to="/game">
                            <strong>Jugar</strong>
                        </Link>

                        <button
                            className="home-action home-action--rotating"
                            key={`${acceso.nombre}-${reinicioAcceso}`}
                            type="button"
                            onClick={interactuarConAcceso}
                        >
                            <span className="home-action__icon">{acceso.icono}</span>
                            <span><strong>{acceso.nombre}</strong><small>{acceso.descripcion}</small></span>
                            <span className="home-change-timer home-change-timer--access" />
                        </button>

                        <Link className="home-action home-action--shop" to="/shop">
                            <span className="home-action__icon">$</span>
                            <span><strong>Shop</strong><small>Tienda del puerto</small></span>
                        </Link>

                        <Link className="home-action home-action--logs" to="/logs">
                            <span className="home-action__icon">≡</span>
                            <span><strong>Logs</strong><small>Ultimas novedades</small></span>
                        </Link>
                    </div>

                </article>

                <aside className={`home-panel home-activity ${mostrarActividad ? "" : "home-activity--closed"}`}>
                    <button className="home-activity__toggle" type="button"
                        aria-label={mostrarActividad ? "Cerrar actividad" : "Mostrar actividad"}
                        aria-expanded={mostrarActividad} aria-controls="home-activity-content"
                        onPointerDown={(event) => {
                            activityDrag.current = { x: event.clientX, dragged: false }
                            event.currentTarget.setPointerCapture(event.pointerId)
                        }}
                        onPointerUp={(event) => {
                            if (!activityDrag.current) return
                            const distance = event.clientX - activityDrag.current.x
                            if (Math.abs(distance) > 25) {
                                activityDrag.current.dragged = true
                                setMostrarActividad(distance < 0)
                            }
                        }}
                        onPointerCancel={() => { activityDrag.current = null }}
                        onClick={() => {
                            if (!activityDrag.current?.dragged) setMostrarActividad((current) => !current)
                            activityDrag.current = null
                        }}>
                        {mostrarActividad ? "›" : "‹"}
                    </button>
                    <div id="home-activity-content" className="home-panel__title">
                        <span>Actividad</span>
                    </div>
                </aside>
            </section>

            <footer className="home-footer">
                <span>FishStack: Forever Fish</span>
                <span>DevPlay Studio</span>
            </footer>
            {mostrarRedes && <NetworksModal onClose={() => setMostrarRedes(false)} />}
        </main>
    )
}

export default Home
