import { useRef, useState } from "react"
import { Link } from "react-router-dom"

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

    return (
        <main className="game-page">
            <header className="game-toolbar">
                <Link className="game-back" to="/">
                    ← Volver
                </Link>

                <div className="game-title">
                    <span className="game-status" aria-hidden="true" />
                    <strong>FishStack: Forever Fish</strong>
                    <small>Alpha</small>
                </div>

                <button
                    className="game-fullscreen"
                    type="button"
                    onClick={activarPantallaCompleta}
                >
                    Pantalla completa
                </button>
            </header>

            <section className="game-stage" aria-label="Juego FishStack">
                {cargando && (
                    <div className="game-loading" role="status">
                        <span className="game-loader" />
                        <p>Cargando la alpha…</p>
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
