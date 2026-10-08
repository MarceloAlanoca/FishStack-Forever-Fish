import { useRef, useState } from "react"

import Header from "../../components/Header/Header"
import "./Game.css"

function Game() {
    const frameRef = useRef(null)
    const [cargando, setCargando] = useState(true)

    const activarPantallaCompleta = async () => {
        try {
            await frameRef.current?.requestFullscreen()
        } catch (error) {
            console.error("No se pudo activar la pantalla completa", error)
        }
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

    return (
        <main
            className="game-page"
            onMouseMove={moverFondo}
            onMouseLeave={centrarFondo}
        >
            <div className="game-header">
                <Header />
            </div>

            <div className="game-toolbar">
                <div className="game-title">
                    <span className="game-status" aria-hidden="true" />
                    <strong>FishStack: Forever Fish</strong>
                    <small>DEMO</small>
                </div>

                <button
                    className="game-fullscreen"
                    type="button"
                    onClick={activarPantallaCompleta}
                >
                    Pantalla completa
                </button>
            </div>

            <section className="game-stage" aria-label="Juego FishStack">
                {cargando && (
                    <div className="game-loading" role="status">
                        <span className="game-loader" />
                        <p>Cargando la demo…</p>
                        <small>La primera carga puede tardar un poco.</small>
                    </div>
                )}

                <iframe
                    ref={frameRef}
                    className="game-frame"
                    src="/fishstack-alpha/index.html"
                    title="FishStack: Forever Fish — Alpha"
                    allow="autoplay; fullscreen; gamepad"
                    onLoad={() => setCargando(false)}
                />
            </section>

            <p className="game-hint">
                Haz clic dentro del juego para usar el teclado. Pulsa Esc para salir de pantalla completa.
            </p>
        </main>
    )
}

export default Game
