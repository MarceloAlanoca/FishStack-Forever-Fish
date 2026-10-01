import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { API_URL } from "../../config/api"
import Header from "../../components/Header/Header"
import "./Home.css"

const anuncios = [
    {
        etiqueta: "NUEVA AVENTURA",
        titulo: "El mar te esta esperando",
        texto: "Explora, pesca y mejora tu barco en FishStack: Forever Fish.",
        clase: "anuncio-mar"
    },
    {
        etiqueta: "COMUNIDAD",
        titulo: "Comparte tus mejores capturas",
        texto: "Muy pronto podras mostrar tus peces y logros a otros jugadores.",
        clase: "anuncio-comunidad"
    },
    {
        etiqueta: "MODO INFINITO",
        titulo: "¿Hasta donde puedes llegar?",
        texto: "Preparate para Forever Fish, el desafio que cambia en cada partida.",
        clase: "anuncio-forever"
    }
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
    const [aviso, setAviso] = useState("")

    useEffect(() => {
        const verificarUsuario = async () => {
            const token = localStorage.getItem("token")

            try {
                const respuesta = await fetch(`${API_URL}/api/auth/perfil`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (!respuesta.ok) {
                    localStorage.removeItem("token")
                    navigate("/login")
                    return
                }

                const data = await respuesta.json()
                setUsuario(data.usuario)
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

    const mostrarProximamente = (seccion) => {
        setAviso(`${seccion} estara disponible proximamente.`)
    }

    const cambiarAnuncio = (nuevoAnuncio, direccion) => {
        setDireccionAnuncio(direccion)
        setAnuncioActual(nuevoAnuncio)
        setReinicioAnuncio((valorActual) => valorActual + 1)
    }

    const moverFondo = (event) => {
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
        mostrarProximamente(acceso.nombre)
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

            <Header />

            <section className="home-welcome">
                <p>PUERTO PRINCIPAL</p>
                <h1>Bienvenido, {usuario?.nombreVista || "Pescador"}</h1>
                <span>Elige tu proximo destino.</span>
            </section>

            <section className="home-dashboard">
                <article className="home-panel home-ad">
                    <div className="home-panel__title">
                        <span>Anuncios</span>
                        <small>{anuncioActual + 1} / {anuncios.length}</small>
                    </div>

                    <div className="home-ad__viewport">
                        <div
                            className={`home-ad__slide home-ad--${direccionAnuncio} ${anuncio.clase}`}
                            key={`${anuncioActual}-${direccionAnuncio}-${reinicioAnuncio}`}
                        >
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

                        <button className="home-action home-action--shop" type="button" onClick={() => mostrarProximamente("Shop")}>
                            <span className="home-action__icon">$</span>
                            <span><strong>Shop</strong><small>Tienda del puerto</small></span>
                        </button>

                        <button className="home-action home-action--logs" type="button" onClick={() => mostrarProximamente("Logs")}>
                            <span className="home-action__icon">≡</span>
                            <span><strong>Logs</strong><small>Ultimas novedades</small></span>
                        </button>
                    </div>

                    {aviso && <p className="home-notice" role="status">{aviso}</p>}
                </article>

                <aside className={`home-panel home-activity ${mostrarActividad ? "" : "home-activity--closed"}`}>
                    <button
                        className="home-activity__toggle"
                        type="button"
                        aria-label={mostrarActividad ? "Cerrar actividad" : "Mostrar actividad"}
                        aria-expanded={mostrarActividad}
                        onClick={() => setMostrarActividad((valorActual) => !valorActual)}
                    >
                        {mostrarActividad ? "→" : "←"}
                    </button>

                        <div className="home-panel__title">
                            <span>Actividad</span>
                        </div>

                        <ul>
                            <li>
                                <span className="activity-icon">!</span>
                                <div>
                                    <strong>Actualizacion inicial</strong>
                                    <p>El puerto de FishStack ya esta abierto.</p>
                                    <small>HOY</small>
                                </div>
                            </li>
                            <li>
                                <span className="activity-icon">★</span>
                                <div>
                                    <strong>Tu aventura comienza</strong>
                                    <p>Entra al juego y realiza tu primera captura.</p>
                                    <small>NUEVO</small>
                                </div>
                            </li>
                            <li>
                                <span className="activity-icon">?</span>
                                <div>
                                    <strong>Soporte</strong>
                                    <p>Muy pronto podras consultar tus solicitudes.</p>
                                    <small>PROXIMAMENTE</small>
                                </div>
                            </li>
                        </ul>
                </aside>
            </section>

            <footer className="home-footer">
                <span>FishStack: Forever Fish</span>
                <span>DevPlay Studio</span>
            </footer>
        </main>
    )
}

export default Home
