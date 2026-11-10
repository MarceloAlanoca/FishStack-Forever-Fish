import { useCallback, useEffect, useRef, useState } from "react"
import { Navigate } from 'react-router-dom'
import useCurrentUser from '../../hooks/useCurrentUser'
import useGameAccount from './useGameAccount'

import Header from "../../components/Header/Header"
import "./Game.css"

function Game() {
    const frameRef = useRef(null)
    const { usuario, setUsuario, estado } = useCurrentUser()
    const onWallet = useCallback(wallet => {
        setUsuario(current => current ? { ...current, Doblones: wallet.balance, walletRevision: wallet.revision } : current)
    }, [setUsuario])
    const { connection, finish, discardPending, generation } = useGameAccount(frameRef, usuario?.ID_Usuario, onWallet)
    const [cargando, setCargando] = useState(true)
    const [disponible, setDisponible] = useState(null)

    useEffect(() => {
        const controller = new AbortController()
        // head comprueba si existe el juego, sin descargar el contenido de la pagina.
        fetch("/fishstack-alpha/index.html", { method: "HEAD", signal: controller.signal })
            .then((response) => setDisponible(response.ok))
            .catch(() => { if (!controller.signal.aborted) setDisponible(false) })
        return () => controller.abort()
    }, [])

    const activarPantallaCompleta = async () => {
        try {
            await frameRef.current?.requestFullscreen()
        } catch (error) {
            console.error("No se pudo activar la pantalla completa", error)
        }
    }

    const moverFondo = (event) => {
        // convierte la posicion del mouse en un desplazamiento suave, aplicado al fondo mediante css.
        const movimientoX = (event.clientX / window.innerWidth - 0.5) * -18
        const movimientoY = (event.clientY / window.innerHeight - 0.5) * -12

        event.currentTarget.style.setProperty("--background-x", `${movimientoX}px`)
        event.currentTarget.style.setProperty("--background-y", `${movimientoY}px`)
    }

    const centrarFondo = (event) => {
        event.currentTarget.style.setProperty("--background-x", "0px")
        event.currentTarget.style.setProperty("--background-y", "0px")
    }

    if (!localStorage.getItem('token') || estado === 'unauthorized' || connection.status === 'session-ended') return <Navigate to="/login" replace />

    return (
        <main
            className="game-page"
            onMouseMove={moverFondo}
            onMouseLeave={centrarFondo}
        >
            <div className="game-header">
                <Header usuario={usuario} onBeforeLogout={finish} />
            </div>

            <div className={`game-account-status game-account-status--${connection.status}`}>
                <p role="status">{connection.message}</p>
                {connection.canDiscard && <button type="button" onClick={discardPending}>Descartar pendientes y cargar la cuenta</button>}
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
                    disabled={!disponible}
                >
                    Pantalla completa
                </button>
            </div>

            <section className="game-stage" aria-label="Juego FishStack">
                {estado === 'error' && <div className="game-loading" role="alert">
                    <p>No se pudo cargar tu cuenta.</p>
                    <button type="button" onClick={() => window.location.reload()}>Reintentar</button>
                </div>}
                {disponible === false && (
                    <div className="game-loading" role="status">
                        <p>No se pudo cargar el juego.</p>
                    </div>
                )}
                {estado !== 'error' && disponible !== false && cargando && (
                    <div className="game-loading" role="status">
                        <span className="game-loader" />
                        <p>Cargando la demo…</p>
                        <small>La primera carga puede tardar un poco.</small>
                    </div>
                )}

                {disponible && usuario && <iframe
                    key={`${usuario.ID_Usuario}-${generation}`}
                    ref={frameRef}
                    className="game-frame"
                    src="/fishstack-alpha/index.html"
                    title="FishStack: Forever Fish — Alpha"
                    allow="autoplay; fullscreen; gamepad"
                    onLoad={() => setCargando(false)}
                />}
            </section>

            <p className="game-hint">
                Haz clic dentro del juego para usar el teclado. Pulsa Esc para salir de pantalla completa.
            </p>
        </main>
    )
}

export default Game
