import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { API_URL } from "../../config/api"

export default function AccountModal({ type, usuario, onClose, onSaved, onInvalidSession }) {
    const dialogRef = useRef(null)
    const isName = type === "username"
    const isSurname = type === "surname"
    const isText = isName || isSurname
    const [name, setName] = useState(isSurname ? usuario.Apellido : usuario.Usuario)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const dialog = dialogRef.current
        dialog.showModal()
        return () => dialog.close()
    }, [])

    async function submit(event) {
        event.preventDefault()
        if (saving) return
        setError("")
        if (isText && !name.trim()) { setError(isSurname ? "Ingresa un apellido." : "Ingresa un usuario."); return }
        if (!isText && newPassword !== confirmPassword) {
            setError("Las contraseñas nuevas no coinciden.")
            return
        }
        setSaving(true)
        try {
            const body = isSurname ? { Apellido: name.trim() }
                : isName ? { Usuario: name.trim() } : { currentPassword, newPassword, confirmPassword }
            const { data } = await axios.patch(`${API_URL}/me/${type}`, body, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            onSaved(isText ? data : null, isSurname ? "Apellido actualizado." : isName ? "Usuario actualizado." : "Contraseña actualizada.")
        } catch (failure) {
            if ([401, 403, 404].includes(failure.response?.status)) onInvalidSession()
            setError(failure.response?.data?.message || "No se pudo guardar el cambio. Inténtalo de nuevo.")
            setSaving(false)
        }
    }

    return (
        <dialog ref={dialogRef} className="profile-modal" aria-labelledby="account-modal-title"
            onCancel={(event) => { event.preventDefault(); if (!saving) onClose() }}>
            <form onSubmit={submit} aria-busy={saving}>
                <h2 id="account-modal-title">{isSurname ? "Cambiar apellido" : isName ? "Cambiar usuario" : "Cambiar contraseña"}</h2>
                <p className="profile-help">{isSurname ? "Actualiza el apellido que aparece en los datos de tu cuenta." : isName
                    ? "Usarás este nombre para iniciar sesión y aparecerá en tu perfil."
                    : "Confirma tu contraseña actual para guardar una nueva."}</p>
                <fieldset disabled={saving}>
                    {isText ? <label>{isSurname ? "Nuevo apellido" : "Nuevo usuario"}
                        <input autoFocus name={isSurname ? "surname" : "username"} autoComplete={isSurname ? "family-name" : "username"} required maxLength={255}
                            value={name} onChange={(event) => setName(event.target.value)} />
                    </label> : <>
                        <label>Contraseña actual
                            <input autoFocus type="password" name="currentPassword" autoComplete="current-password"
                                required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                        </label>
                        <label>Nueva contraseña
                            <input type="password" name="newPassword" autoComplete="new-password" required minLength={8} maxLength={72}
                                value={newPassword} onChange={(event) => setNewPassword(event.target.value)} aria-describedby="password-help" />
                        </label>
                        <p className="profile-help" id="password-help">Al menos 8 caracteres. Máximo 72 bytes; algunos símbolos ocupan más de uno.</p>
                        <label>Repetir nueva contraseña
                            <input type="password" name="confirmPassword" autoComplete="new-password" required minLength={8} maxLength={72}
                                value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                        </label>
                    </>}
                </fieldset>
                <p className="profile-modal-error" role="alert">{error}</p>
                <div className="profile-modal-actions">
                    <button type="button" disabled={saving} onClick={onClose}>Cancelar</button>
                    <button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
                </div>
            </form>
        </dialog>
    )
}
