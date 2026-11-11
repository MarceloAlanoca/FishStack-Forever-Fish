import { useEffect, useState } from "react"
import axios from "axios"
import { API_URL } from "../../config/api"

const dateFormat = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
})

export default function ActivityFeed() {
    const [entries, setEntries] = useState(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        const token = localStorage.getItem("token")
        let current = []
        let serverTime = 0
        let receivedAt = 0
        let refreshTimer
        let expiryTimer

        const showRecent = () => {
            clearTimeout(expiryTimer)
            const now = serverTime + performance.now() - receivedAt
            current = current.filter(entry => Date.parse(entry.expiresAt) > now)
            setEntries(current)

            const oldest = current.at(-1)
            if (oldest) {
                expiryTimer = setTimeout(showRecent, Math.ceil(Date.parse(oldest.expiresAt) - now))
            }
        }

        const refresh = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/me/activity`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                    timeout: 10000
                })
                if (controller.signal.aborted) return
                current = data.entries
                serverTime = Date.parse(data.serverTime)
                receivedAt = performance.now()
                setFailed(false)
                showRecent()
            } catch {
                if (!controller.signal.aborted) setFailed(true)
            } finally {
                if (!controller.signal.aborted) refreshTimer = setTimeout(refresh, 15000)
            }
        }

        refresh()
        return () => {
            controller.abort()
            clearTimeout(refreshTimer)
            clearTimeout(expiryTimer)
        }
    }, [])

    if (!entries?.length) {
        let message = "Cargando actividad…"
        if (failed) message = "No se pudo cargar tu actividad."
        else if (entries) message = "No hay actividad en los últimos 30 minutos."
        return <p className="home-activity__status" role="status">{message}</p>
    }

    return (
        <ul className="home-activity__entries" aria-label="Actividad reciente">
            {entries.map(entry => (
                <li key={entry.id}>
                    <div>
                        <strong>{entry.message}</strong>
                        <small><time dateTime={entry.createdAt}>
                            {dateFormat.format(new Date(entry.createdAt)).replace(", ", " · ")}
                        </time></small>
                    </div>
                </li>
            ))}
        </ul>
    )
}
