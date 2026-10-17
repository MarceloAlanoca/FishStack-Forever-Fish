import { useState } from "react"
import { API_URL } from "../../config/api"
import "./Avatar.css"

export default function Avatar({ usuario }) {
    const [failedPhoto, setFailedPhoto] = useState(null)
    const storedPhoto = usuario?.Foto_Perfil
    const photo = storedPhoto?.startsWith("/images/users/")
        ? `${API_URL.replace(/\/$/, "")}${storedPhoto}`
        : storedPhoto
    const name = usuario?.Nombre_Vista || "Pescador"
    return (
        <span className="user-avatar" aria-hidden="true">
            {photo && failedPhoto !== photo ? (
                <img src={photo} alt="" onError={() => setFailedPhoto(photo)} />
            ) : name.slice(0, 2).toUpperCase()}
        </span>
    )
}
