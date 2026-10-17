import { useEffect, useRef, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import axios from "axios"
import { API_URL } from "../../config/api"
import useCurrentUser from "../../hooks/useCurrentUser"
import Header from "../../components/Header/Header"
import Avatar from "../../components/Avatar/Avatar"
import AccountModal from "./AccountModal"
import "./Profile.css"

async function preparePhoto(file) {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Elige una imagen JPG, PNG o WebP.")
    }
    if (file.size > 5 * 1024 * 1024) throw new Error("La imagen debe pesar menos de 5 MB.")
    const bitmap = await createImageBitmap(file)
    try {
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = 256
        const side = Math.min(bitmap.width, bitmap.height)
        canvas.getContext("2d").drawImage(bitmap,
            (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256)
        return await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob)
                else reject(new Error("No se pudo preparar la imagen."))
            }, "image/png")
        })
    } finally {
        bitmap.close()
    }
}

export default function Profile() {
    const { usuario, setUsuario, estado } = useCurrentUser()
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")
    const [invalidSession, setInvalidSession] = useState(false)
    const [modal, setModal] = useState(null)
    const pageRef = useRef(null)

    useEffect(() => {
        const moverFondo = (event) => {
            if (event.pointerType === "touch") return
            const x = (event.clientX / window.innerWidth - 0.5) * -44
            const y = (event.clientY / window.innerHeight - 0.5) * -28
            pageRef.current?.style.setProperty("--profile-background-x", `${x}px`)
            pageRef.current?.style.setProperty("--profile-background-y", `${y}px`)
        }
        const centrarFondo = () => {
            pageRef.current?.style.setProperty("--profile-background-x", "0px")
            pageRef.current?.style.setProperty("--profile-background-y", "0px")
        }
        const salirDeVentana = (event) => {
            if (!event.relatedTarget) centrarFondo()
        }
        window.addEventListener("pointermove", moverFondo, { passive: true })
        window.addEventListener("pointerout", salirDeVentana)
        window.addEventListener("blur", centrarFondo)
        return () => {
            window.removeEventListener("pointermove", moverFondo)
            window.removeEventListener("pointerout", salirDeVentana)
            window.removeEventListener("blur", centrarFondo)
        }
    }, [])

    async function savePhoto(file) {
        setSaving(true)
        setMessage("")
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            let response
            if (file === null) {
                response = await axios.delete(`${API_URL}/me/photo`, config)
            } else {
                const form = new FormData()
                form.append("Foto_Perfil", await preparePhoto(file), "perfil.png")
                response = await axios.patch(`${API_URL}/me/photo`, form, config)
            }
            setUsuario(response.data)
            setMessage(file === null ? "Foto eliminada." : "Foto guardada.")
        } catch (error) {
            if ([401, 403, 404].includes(error.response?.status)) setInvalidSession(true)
            setMessage(error.response?.data?.message || error.message || "No se pudo guardar la foto.")
        } finally {
            setSaving(false)
        }
    }

    if (estado === "unauthorized" || invalidSession) return <Navigate to="/login" replace />

    return (
        <main ref={pageRef} className="profile-page">
            <div className="profile-background" aria-hidden="true">
                <div className="profile-background__image" />
            </div>
            <Header usuario={usuario} />
            <section className="profile-card" aria-labelledby="profile-title">
                <Link className="profile-back" to="/home">← Volver a Home</Link>
                <h1 id="profile-title">Mi perfil</h1>
                {estado === "loading" && <p role="status">Cargando tu perfil…</p>}
                {estado === "error" && <p role="alert">No se pudo cargar el perfil. <button type="button" onClick={() => window.location.reload()}>Reintentar</button></p>}
                {usuario && <>
                    <div className="profile-identity">
                        <Avatar usuario={usuario} />
                        <div><h2>{usuario.Nombre_Vista}</h2><p>Tu cuenta de FishStack</p></div>
                    </div>
                    <div className="profile-photo-actions">
                        <label className="profile-photo-button">
                            {saving ? "Guardando…" : "Cambiar foto"}
                            <input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving}
                                onChange={(event) => {
                                    const file = event.target.files?.[0]
                                    event.target.value = ""
                                    if (file) savePhoto(file)
                                }} />
                        </label>
                        {usuario.Foto_Perfil && <button type="button" disabled={saving} onClick={() => savePhoto(null)}>Quitar foto</button>}
                    </div>
                    <p className="profile-help">JPG, PNG o WebP, hasta 5 MB. La foto se recorta al centro.</p>
                    <p className="profile-message" role="status">{message}</p>
                    <dl className="profile-details">
                        <div><dt>Usuario</dt><dd>{usuario.Nombre_Vista}</dd></div>
                        <div><dt>Nombre</dt><dd>{usuario.Nombre}</dd></div>
                        <div><dt>Apellido</dt><dd>{usuario.Apellido}</dd></div>
                        <div><dt>Correo</dt><dd>{usuario.Correo}</dd></div>
                    </dl>
                    <div className="profile-account-actions">
                        <button type="button" disabled={saving} onClick={() => setModal("username")}>Cambiar nombre de usuario</button>
                        <button type="button" disabled={saving} onClick={() => setModal("surname")}>Cambiar apellido</button>
                        <button type="button" disabled={saving} onClick={() => setModal("password")}>Cambiar contraseña</button>
                    </div>
                    {modal && <AccountModal type={modal} usuario={usuario}
                        onClose={() => setModal(null)}
                        onInvalidSession={() => setInvalidSession(true)}
                        onSaved={(updatedUser, successMessage) => {
                            if (updatedUser) setUsuario(updatedUser)
                            setMessage(successMessage)
                            setModal(null)
                        }} />}
                    <aside className="profile-future"><strong>Doblones · Próximamente</strong><p>Tu saldo estará disponible cuando conectemos el juego.</p></aside>
                </>}
            </section>
        </main>
    )
}
