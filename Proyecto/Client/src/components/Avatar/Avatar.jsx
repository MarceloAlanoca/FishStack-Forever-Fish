import { useState } from "react"
import { API_URL } from "../../config/api"
import "./Avatar.css"

export default function Avatar({ usuario }) {
    const [failedPhoto, setFailedPhoto] = useState(null)
    const storedPhoto = usuario?.Foto_Perfil
    // completa la ruta con la direccion de la api, replace evita duplicar la barra de union.
    const photo = storedPhoto?.startsWith("/images/users/")
        ? `${API_URL.replace(/\/$/, "")}${storedPhoto}`
        : storedPhoto
    const name = usuario?.Usuario || "Pescador"
    return (
        <span className="user-avatar" aria-hidden="true">
            {photo && failedPhoto !== photo ? (
                <img src={photo} alt="" onError={() => setFailedPhoto(photo)} />
            ) : name.slice(0, 2).toUpperCase()}
        </span>
    )
}
