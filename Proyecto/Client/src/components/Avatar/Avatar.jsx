import { useState } from "react"
import "./Avatar.css"

export default function Avatar({ usuario }) {
    const [failedPhoto, setFailedPhoto] = useState(null)
    const photo = usuario?.Foto_Perfil
    const name = usuario?.Nombre_Vista || "Pescador"
    return (
        <span className="user-avatar" aria-hidden="true">
            {photo && failedPhoto !== photo ? (
                <img src={photo} alt="" onError={() => setFailedPhoto(photo)} />
            ) : name.slice(0, 2).toUpperCase()}
        </span>
    )
}
