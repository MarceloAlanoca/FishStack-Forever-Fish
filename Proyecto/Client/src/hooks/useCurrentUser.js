import { useEffect, useState } from "react"
import axios from "axios"
import { API_URL } from "../config/api"

export default function useCurrentUser(enabled = true) {
    const [usuario, setUsuario] = useState(null)
    const [estado, setEstado] = useState("loading")
    useEffect(() => {
        if (!enabled) return
        // permite cancelar la consulta si el componente se desmonta antes de recibir la respuesta.
        const controller = new AbortController()
        const token = localStorage.getItem("token")
        if (!token) return
        axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
        }).then(({ data }) => {
            setUsuario(data)
            setEstado("ready")
        }).catch((error) => {
            // una cancelacion al salir de la pagina no se muestra como un error de sesion.
            if (controller.signal.aborted) return
            setEstado([401, 403, 404].includes(error.response?.status) ? "unauthorized" : "error")
        })
        return () => controller.abort()
    }, [enabled])
    return { usuario, setUsuario, estado }
}
