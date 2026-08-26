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
            descripcion: "Nullscape es un juego de Roblox que es un RogueLike donde recoges regalos y asciendes niveles en un mundo vacio y subrealista",
            inspiracion: "Nos inspiró principalmente para trabajar los fondos dinámicos y practicamente todo el modo forever fish."
        },
        {
            nombre: "The Binding of Isaac",
            clase: "tboi",
            portada: "/images/inspiraciones/tboi-portada.jpe",
            video: "/videos/tboi-gameplay.mp4",
            segundoInicio: 5,
            link: "https://store.steampowered.com/app/113200/The_Binding_of_Isaac/?l=spanish",
            descripcion: "The Binding of Isaac es un roguelike centrado en explorar habitaciones, obtener objetos y crear combinaciones entre diferentes items y activables.",
            inspiracion: "Fue una referencia para pensar sistemas de objetos, amuletos, estadísticas y combinaciones que puedan modificar la forma de jugar. tambien algunas mejoras y maldiciones se inspiran de algunos existentes de TBOI"
        },
        {
            nombre: "GRACE",
            clase: "grace",
            portada: "/images/inspiraciones/grace-portada.jpg",
            video: "/videos/grace-gameplay.mp4",
            segundoInicio: 17,
            link: "https://www.roblox.com/es/games/138837502355157/Grace",
            descripcion: "GRACE es una experiencia de Roblox, destaca por su identidad visual, ambientación y presentación de sus escenarios. Similar a Doors pero con una representacion biblica",
            inspiracion: "Nos ayudo a hacer un par de enemigos, efectos y estilos de perks unicos dentro del modo forever fish"
        },
        {
            nombre: "Dredge",
            clase: "dredge",
            portada: "/images/inspiraciones/dredge-portada.jpe",
            video: "/videos/dredge-gameplay.mp4",
            segundoInicio: 0,
            link: "https://store.steampowered.com/app/1562430/DREDGE/?l=spanish",
            descripcion: "Dredge es un juego de pesca y exploración con una ambientación misteriosa y diferentes criaturas marinas.",
            inspiracion: "Es una de las principales referencias para la temática de pesca, la variedad de peces, la exploración marítima y la ambientación dentro del modo historia."
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
        },
        {
            nombre: "Deltarune",
            clase: "deltarune",
            portada: "/images/inspiraciones/deltarune-portada.jpg",
            video: "/videos/deltarune-gameplay.mp4",
            segundoInicio: 2,
            link: "https://store.steampowered.com/app/1671210/DELTARUNE/",
            descripcion: "Deltarune es un videojuego de rol (RPG) creado por el desarrollador independiente Toby Fox, ambientado en un mundo paralelo al de su popular obra anterior, Undertale",
            inspiracion: "Nos inspiro para el sistema de vidas y uso de items dentro del modo historia (y practiacmente lo mismo como el apartado de undertale)",
        },
        {
            nombre: "Mario World",
            clase: "marioworld",
            portada: "/images/inspiraciones/marioworld-portada.jpg",
            video: "/videos/marioworld-gameplay.mp4",
            segundoInicio: 5,
            link: "https://www.nintendo.com/es-es/Juegos/Super-Nintendo/Super-Mario-World-752133.html?srsltid=AfmBOormaOWKvR0zaDnCD_-PA223i60qP8oTH1L_z2c-cv9WM8SpewlG",
            descripcion: "Super Mario World es un clásico videojuego de plataformas en dos dimensiones donde Mario y su nuevo compañero, el dinosaurio Yoshi, deben rescatar a la Princesa Peach de las garras de Bowser",
            inspiracion: "Nos inspiro mayormente para el formato de seleccion de mundos dentro del modo historia, y algunos peces y consumibles de su mundo tambien.",
        },
        {
            nombre: "Fisch",
            clase: "fisch",
            portada: "/images/inspiraciones/fisch-portada.jpg",
            video: "/videos/fisch-gameplay.mp4",
            segundoInicio: 0,
            link: "",
            descripcion: "Fisch en Roblox es una experiencia de aventura y exploración de mundo abierto, cuyo objetivo principal es pescar para obtener ganancias, completar misiones y llenar un bestiario.",
            inspiracion: "Practicamente la inspiracion del primer juego y de este ahora aun tambien, sus multiples items como cañas, barcos y cebos nos inspiro a hacer el modo historia. Tambien algunos peces extravagantes y graciosos que tenian nos ayudaron en el apartado artistico",
        }

        // plantilla de inspiración: { nombre, clase, portada, video, segundoInicio, link, descripcion, inspiracion }
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

            </section>


            {/* inspiraciones */}

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


                    {/* información */}

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

            </section>

        </main>
    )
}

export default Credits
