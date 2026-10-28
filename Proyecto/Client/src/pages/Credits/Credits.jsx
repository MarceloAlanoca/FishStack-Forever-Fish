import { useEffect, useRef, useState } from "react"
import { Modal, Box, Typography, Button } from "@mui/material"
import Hls from "hls.js"
import axios from "axios"
import { API_URL } from "../../config/api"
import Header from "../../components/Header/Header"
import "./Credits.css"

function Credits() {
    const [integrantes, setIntegrantes] = useState([])
    const [inspiraciones, setInspiraciones] = useState([])
    const [estado, setEstado] = useState("loading")
    const [reintento, setReintento] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        axios.get(API_URL + "/credits", { signal: controller.signal })
            .then(({ data }) => {
                setIntegrantes(data.integrantes)
                setInspiraciones(data.inspiraciones)
                setEstado("ready")
            })
            .catch(() => {
                if (!controller.signal.aborted) setEstado("error")
            })
        return () => controller.abort()
    }, [reintento])

    const videoRef = useRef(null)
    const modalVideoRef = useRef(null)

    const [modalAbierto, setModalAbierto] = useState(false)
    const [integranteSeleccionado, setIntegranteSeleccionado] = useState(null)

    const abrirModal = (integrante) => {
        setIntegranteSeleccionado(integrante)
        setModalAbierto(true)
    }

    const cerrarModal = () => {
        setModalAbierto(false)
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

    const [inspiracionActual, setInspiracionActual] = useState(0)

    const siguienteInspiracion = () => {
        setInspiracionActual((actual) =>
            actual === inspiraciones.length - 1
                ? 0
                : actual + 1
        )
    }

    const anteriorInspiracion = () => {
        setInspiracionActual((actual) =>
            actual === 0
                ? inspiraciones.length - 1
                : actual - 1
        )
    }

    const inspiracion = inspiraciones[inspiracionActual]

    useEffect(() => {

        const video = videoRef.current

        if (!video || !inspiracion) return

        const colocarTiempo = () => {
            video.currentTime = inspiracion.segundoInicio || 0

            video.play().catch(() => {
            })
        }

        // el estado 1 indica que los metadatos estan disponibles, y ya se puede elegir el segundo inicial.
        if (video.readyState >= 1) {
            colocarTiempo()
        } else {
            video.addEventListener("loadedmetadata", colocarTiempo, { once: true })
        }

        return () => video.removeEventListener("loadedmetadata", colocarTiempo)
    }, [inspiracion])

    useEffect(() => {
        if (!modalAbierto || !modalVideoRef.current) return

        const video = modalVideoRef.current
        const src = "https://stream.mux.com/Jwr2RhmsNrd6GEspBNgm02vJsRZAGlaoQIh4AucGdASw.m3u8"

        // usa la reproduccion nativa si existe, o hls.js para reproducir el video por segmentos.
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src
        } else if (Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(src)
            hls.attachMedia(video)

            // libera el reproductor y sus descargas, al cerrar el modal.
            return () => hls.destroy()
        }
    }, [modalAbierto])

    return (
        <div
            className="credits-page"
            onMouseMove={moverFondo}
            onMouseLeave={centrarFondo}
        >
            <div className="credits-header">
                <Header />
            </div>

            <main className="credits" aria-busy={estado === "loading"}>
                {estado === "loading" && <p role="status">Cargando creditos...</p>}
                {estado === "error" && <div role="alert">
                    <p>No se pudieron cargar los creditos. Comprueba la conexion e intenta nuevamente.</p>
                    <Button onClick={() => {
                        setEstado("loading")
                        setReintento((actual) => actual + 1)
                    }}>Reintentar</Button>
                </div>}
                {estado === "ready" && integrantes.length === 0 && inspiraciones.length === 0 &&
                    <p>No hay creditos disponibles.</p>}


            {integrantes.length > 0 && <section className="integrantes">

                <div className="titulo-seccion">
                    <h1>Créditos</h1>

                    <p>
                        Las personas que participaron en el desarrollo de
                        FishStack: Forever Fish.
                    </p>
                </div>

                <div className="integrantes-grid">
                    {integrantes.map((integrante) => (
                        <article className="integrante-card" key={integrante.id}>
                            <video
                                className="integrante-video-fondo"
                                src={integrante.video}
                                autoPlay
                                muted
                                loop
                                playsInline
                            />

                            <div className="integrante-overlay" />

                            <div className="integrante-contenido">
                                <img
                                    className="integrante-avatar"
                                    src={integrante.imagen}
                                    alt={integrante.nombre}
                                />

                                <div className="integrante-info">
                                    <h2>{integrante.nombre}</h2>
                                    <h3>{integrante.rol}</h3>
                                    <p>{integrante.descripcion}</p>

                                    <Button
                                        variant="outlined"
                                        onClick={() => abrirModal(integrante)}
                                    >
                                        Detalle
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <Modal
                    open={modalAbierto}
                    onClose={cerrarModal}
                    aria-labelledby="modal-integrante-titulo"
                    aria-describedby="modal-integrante-descripcion"
                >
                    <Box className="modal-integrante">
                        <video
                            ref={modalVideoRef}
                            className="modal-video-fondo"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />

                        <div className="modal-overlay" />

                        {integranteSeleccionado && (
                            <div className="modal-frente">
                                <button className="modal-cerrar" onClick={cerrarModal}>×</button>

                                <div className="modal-cabecera">
                                    <img
                                        src={integranteSeleccionado.imagen}
                                        alt={integranteSeleccionado.nombre}
                                    />

                                    <div>
                                        <Typography id="modal-integrante-titulo" variant="h4" component="h2">
                                            {integranteSeleccionado.nombre}
                                        </Typography>

                                        <Typography variant="h6">
                                            {integranteSeleccionado.rol}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="modal-contenido">
                                    <Typography id="modal-integrante-descripcion" component="p">
                                        {integranteSeleccionado.detalle}
                                    </Typography>

                                    <h3>Aporte al proyecto</h3>

                                    <Typography component="p">
                                        {integranteSeleccionado.aporte}
                                    </Typography>
                                </div>
                            </div>
                        )}
                    </Box>
                </Modal>

            </section>}


            {/* inspiraciones */}

            {inspiracion && <section className="inspiraciones">

                <div className="titulo-seccion">

                    <h2>
                        Inspiraciones
                    </h2>

                    <p>
                        Juegos y experiencias que ayudaron a definir distintas
                        partes de FishStack: Forever Fish.
                    </p>

                </div>


                <div
                    className={`inspiracion-card ${inspiracion.clase}`}
                >

                    {/* flecha izquierda */}

                    <button
                        className="flecha flecha-izquierda"
                        onClick={anteriorInspiracion}
                        aria-label="Inspiración anterior"
                    >
                        ❮
                    </button>


                    {/* portada */}

                    <a
                        className="inspiracion-portada"
                        href={inspiracion.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src={inspiracion.portada}
                            alt={`Portada de ${inspiracion.nombre}`}
                        />

                        <div className="portada-nombre">
                            <h3>{inspiracion.nombre}</h3>
                        </div>
                    </a>


                    {/* informacion */}

                    <div className="inspiracion-info">

                        <div className="inspiracion-scroll">

                            <div className="gameplay">

                                <video
                                    ref={videoRef}
                                    src={inspiracion.video}
                                    controls
                                    autoPlay
                                    muted
                                    playsInline
                                    preload="metadata"
                                />

                            </div>


                            <div className="inspiracion-texto">

                                <h3>
                                    ¿De qué trata?
                                </h3>

                                <p>
                                    {inspiracion.descripcion}
                                </p>


                                <h3>
                                    ¿Por qué nos inspiró?
                                </h3>

                                <p>
                                    {inspiracion.inspiracion}
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* flecha derecha */}

                    <button
                        className="flecha flecha-derecha"
                        onClick={siguienteInspiracion}
                        aria-label="Siguiente inspiración"
                    >
                        ❯
                    </button>

                </div>


                {/* indicadores */}

                <div className="indicadores">

                    {inspiraciones.map((juego, index) => (

                        <button
                            key={juego.nombre}
                            aria-label={`Ir a ${juego.nombre}`}
                            className={
                                index === inspiracionActual
                                    ? "indicador activo"
                                    : "indicador"
                            }
                            onClick={() =>
                                setInspiracionActual(index)
                            }
                        />

                    ))}

                </div>

            </section>}

            </main>
        </div>
    )
}

export default Credits
