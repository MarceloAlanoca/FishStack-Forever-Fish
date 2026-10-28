import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { API_URL } from "../../config/api"
import "./RecoveryModal.css"

export default function RecoveryModal({ reset = false, token = "", onClose, onSuccess }) {
    const dialogRef = useRef(null)
    const requestRef = useRef(null)
    const validLink = /^[a-f0-9]{64}$/.test(token)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmation, setConfirmation] = useState("")
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [done, setDone] = useState(false)

    useEffect(() => {
        const dialog = dialogRef.current
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        const meta = document.createElement("meta")
        meta.name = "referrer"
        meta.content = "no-referrer"
        document.head.appendChild(meta)
        dialog.showModal()
        return () => {
            requestRef.current?.abort()
            dialog.close()
            document.body.style.overflow = previousOverflow
            meta.remove()
        }
    }, [])

    async function submit(event) {
        event.preventDefault()
        if (busy) return
        setError("")
        setMessage("")
        if (reset && (password !== confirmation || password.length < 8 || new TextEncoder().encode(password).length > 72)) {
            setError("Las contraseñas deben coincidir y tener al menos 8 caracteres y como máximo 72 bytes.")
            return
        }
        setBusy(true)
        const controller = new AbortController()
        requestRef.current = controller
        try {
            const body = reset ? { token, newPassword: password, confirmPassword: confirmation } : { Correo: email.trim() }
            const { data } = await axios.post(API_URL + (reset ? "/reset-password" : "/forgot-password"), body, { signal: controller.signal })
            if (reset) {
                localStorage.removeItem("token")
                onSuccess(data.message)
                return
            }
            setMessage(data.message)
            setDone(true)
        } catch (failure) {
            if (!controller.signal.aborted) setError(failure.response?.data?.message || "No se pudo conectar con el servidor. Intenta nuevamente.")
        } finally {
            if (!controller.signal.aborted) setBusy(false)
        }
    }

    return (
        <dialog ref={dialogRef} className="recovery-modal" aria-labelledby="recovery-title" aria-describedby="recovery-help"
            onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
            <button className="recovery-modal__close" type="button" disabled={busy} onClick={onClose} aria-label="Cerrar recuperacion">×</button>
            <header className="login-card__header">
                <span className="login-card__kicker">RECUPERAR ACCESO</span>
                <h2 id="recovery-title">{reset ? "Nueva contraseña" : "Recuperar contraseña"}</h2>
                <p id="recovery-help">{reset ? "Elegí una contraseña nueva para tu cuenta." : "Ingresá el correo registrado. Te enviaremos un enlace que vence en 15 minutos."}</p>
            </header>
                {reset && !validLink && !done ? <p className="login-form__message" role="alert">El enlace está incompleto o no es válido. Solicitá uno nuevo.</p> :
                    !done && <form className="login-form" onSubmit={submit} aria-busy={busy}>
                        {reset ? <>
                            <label><span>Nueva contraseña</span>
                                <input type="password" autoComplete="new-password" required minLength={8} maxLength={72}
                                    autoFocus value={password} onChange={(event) => setPassword(event.target.value)} />
                            </label>
                            <label><span>Confirmar nueva contraseña</span>
                                <input type="password" autoComplete="new-password" required minLength={8} maxLength={72}
                                    value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
                            </label>
                        </> : <label><span>Correo de tu cuenta</span>
                            <input type="email" autoComplete="email" required maxLength={255} placeholder="tu-correo@ejemplo.com"
                                autoFocus value={email} onChange={(event) => setEmail(event.target.value)} />
                        </label>}
                        <button className="login-form__submit" type="submit" disabled={busy}>
                            {busy ? "Procesando..." : reset ? "Guardar nueva contraseña" : "Enviar enlace"}
                        </button>
                    </form>}
                {error && <p className="login-form__message recovery-error" role="alert">{error}</p>}
                {message && <p className="login-form__message" role="status">{message}</p>}

            {reset && <div className="recovery-modal__actions">
                <button type="button" disabled={busy} onClick={onClose}>Volver al login</button>
            </div>}
        </dialog>
    )
}
