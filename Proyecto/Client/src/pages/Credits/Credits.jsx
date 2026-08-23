import { useEffect, useRef, useState } from "react"
import { Modal, Box, Typography, Button } from "@mui/material"
import Hls from "hls.js"
import "./Credits.css"

function Credits() {
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

    const integrantes = [
        {
            id: 1,
            nombre: "Thiago",
            rol: "Programación",
            descripcion: "Encargado principal de la programacion de los sistemas del juego y desarrollo web.",
            detalle: "Participó en la programación de mecánicas, sistemas de pesca, interfaz, integración web y organización de diferentes sistemas del proyecto.",
            aporte: "Su trabajo principal estuvo enfocado en convertir las ideas del equipo en sistemas funcionales dentro del juego y pagina.",
            imagen: "/images/Integrantes/Thiago.jpg",
            video: "/videos/Integrantes/Fondo.mp4"
        },
        {
            id: 2,
            nombre: "Gael",
            rol: "Arte - Promocion",
            descripcion: "Participó en la creación de sprites, escenarios, lore del juego y promocion, mecarderia del proyecto.",
            detalle: "Trabajó principalmente en distintas partes relacionadas con el apartado visual del proyecto.",
            aporte: "Ayudó a construir la identidad visual, lore y promocion del juego.",
            imagen: "/images/Integrantes/Gael.jpg",
            video: "/videos/Integrantes/cobra.mp4"
        },
        {
            id: 3,
            nombre: "Marcelo",
            rol: "Progamacion - Camino",
            descripcion: "Trabajó en cosas agregadas dentro del juego y cosas de diseño de la pagina. El scrum master del proyecto",
            detalle: ".",
            aporte: "",
            imagen: "/images/Integrantes/Marcelo.jpg",
            video: "/videos/Integrantes/bruh.mp4"
        },
        {
            id: 4,
            nombre: "John",
            rol: "Música - Diseño",
            descripcion: "Participó en la ambientación sonora y elementos musicales del proyecto.",
            detalle: "Trabajó en elementos relacionados con música y ambientación del juego.",
            aporte: "Su trabajo ayudó a darle personalidad sonora a los diferentes escenarios.",
            imagen: "/images/Integrantes/John.jpg",
            video: "/videos/Integrantes/aqua.mp4"
        }
    ]

    const inspiraciones = [
        {
            nombre: "Nullscape",
            clase: "nullscape",
            portada: "/images/inspiraciones/nullscape-portada.jpe",
            video: "/videos/nullscape-gameplay.mp4",
            segundoInicio: 35,
            link: "https://www.roblox.com/es/games/129279692364812/Nullscape",
            descripcion: "Nullscape es un juego de Roblox que utiliza escenarios surrealistas...",
            inspiracion: "Nos inspiró principalmente para trabajar los fondos dinámicos..."
        },
        {
            nombre: "The Binding of Isaac",
            clase: "tboi",
            portada: "/images/inspiraciones/tboi-portada.jpe",
            video: "/videos/tboi-gameplay.mp4",
            segundoInicio: 5,
            link: "https://store.steampowered.com/app/113200/The_Binding_of_Isaac/?l=spanish",
            descripcion: "The Binding of Isaac es un roguelike centrado en explorar habitaciones, obtener objetos y crear combinaciones entre diferentes efectos.",
            inspiracion: "Fue una referencia para pensar sistemas de objetos, amuletos, estadísticas y combinaciones que puedan modificar la forma de jugar."
        },
        {
            nombre: "GRACE",
            clase: "grace",
            portada: "/images/inspiraciones/grace-portada.jpg",
            video: "/videos/grace-gameplay.mp4",
            segundoInicio: 17,
            link: "https://www.roblox.com/es/games/138837502355157/Grace",
            descripcion: "GRACE destaca por su identidad visual, ambientación y presentación de sus escenarios.",
            inspiracion: "Nos sirvió como referencia para buscar una estética reconocible y una presentación más cuidada de los diferentes lugares del juego."
        },
        {
            nombre: "Dredge",
            clase: "dredge",
            portada: "/images/inspiraciones/dredge-portada.jpe",
            video: "/videos/dredge-gameplay.mp4",
            segundoInicio: 0,
            link: "https://store.steampowered.com/app/1562430/DREDGE/?l=spanish",
            descripcion: "Dredge es un juego de pesca y exploración con una ambientación misteriosa y diferentes criaturas marinas.",
            inspiracion: "Es una de las principales referencias para la temática de pesca, la variedad de peces, la exploración marítima y la ambientación."
        },
        {
            nombre: "Undertale",
            clase: "undertale",
            portada: "/images/inspiraciones/undertale-portada.jpg",
            video: "/videos/undertale-gameplay.mp4",
            segundoInicio: 0,
            link: "https://store.steampowered.com/app/391540/Undertale/?l=spanish",
            descripcion: "Undertale es un RPG conocido por su pixel art, sus personajes y su forma de conectar distintas zonas mediante pequeños escenarios.",
            inspiracion: "Nos inspiró especialmente en la exploración 2D, la división del mundo en zonas y el estilo de interacción con personajes y escenarios."
        }
    ]

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

    useEffect(() => {

        const video = videoRef.current

        if (!video) return

        const colocarTiempo = () => {
            video.currentTime = inspiracion.segundoInicio || 0

            video.play().catch(() => {
            })
        }

        if (video.readyState >= 1) {
            colocarTiempo()
        } else {
            video.addEventListener("loadedmetadata", colocarTiempo, { once: true })
        }

    }, [inspiracionActual])

    const inspiracion = inspiraciones[inspiracionActual]

    useEffect(() => {
        if (!modalAbierto || !modalVideoRef.current) return

        const video = modalVideoRef.current
        const src = "https://stream.mux.com/Jwr2RhmsNrd6GEspBNgm02vJsRZAGlaoQIh4AucGdASw.m3u8"

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src
        } else if (Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(src)
            hls.attachMedia(video)

            return () => hls.destroy()
        }
    }, [modalAbierto])

    return (
        <main className="credits">

            {/* ========================= */}
            {/* INTEGRANTES */}
            {/* ========================= */}

            <section className="integrantes">

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
                                        Ver más
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

            </section>


            {/* ========================= */}
            {/* INSPIRACIONES */}
            {/* ========================= */}

            <section className="inspiraciones">

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

                    {/* FLECHA IZQUIERDA */}

                    <button
                        className="flecha flecha-izquierda"
                        onClick={anteriorInspiracion}
                        aria-label="Inspiración anterior"
                    >
                        ❮
                    </button>


                    {/* ========================= */}
                    {/* PORTADA */}
                    {/* ========================= */}

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


                    {/* ========================= */}
                    {/* INFORMACIÓN */}
                    {/* ========================= */}

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


                    {/* FLECHA DERECHA */}

                    <button
                        className="flecha flecha-derecha"
                        onClick={siguienteInspiracion}
                        aria-label="Siguiente inspiración"
                    >
                        ❯
                    </button>

                </div>


                {/* INDICADORES */}

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

            </section>

        </main>
    )
}

export default Credits