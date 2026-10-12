import { useEffect, useState } from "react"
import axios from "axios"
import { API_URL } from "../config/api"

export default function useCurrentUser(enabled = true) {
    const [usuario, setUsuario] = useState(null)
    const [estado, setEstado] = useState("loading")
    useEffect(() => {
        if (!enabled) return
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
            if (controller.signal.aborted) return
            setEstado([401, 403, 404].includes(error.response?.status) ? "unauthorized" : "error")
        })
        return () => controller.abort()
    }, [enabled])
    return { usuario, setUsuario, estado }
}
