import { useCallback, useEffect, useRef, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import axios from "axios"
import Header from "../../components/Header/Header"
import useCurrentUser from "../../hooks/useCurrentUser"
import { API_URL } from "../../config/api"
import "./Missions.css"

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
const number = value => new Intl.NumberFormat("es-AR").format(value)

export default function Missions() {
    const { usuario, setUsuario } = useCurrentUser()
    const [data, setData] = useState(null)
    const [answers, setAnswers] = useState({})
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    const [unauthorized, setUnauthorized] = useState(false)
    const active = useRef(false)
    const request = useRef(false)

    const load = useCallback(async () => {
        const { data: result } = await axios.get(`${API_URL}/missions`, config())
        if (!active.current) return
        setData(result)
        setAnswers({})
    }, [])

    useEffect(() => {
        active.current = true
        load().catch(error => {
            if (!active.current) return
            if ([401, 403].includes(error.response?.status)) setUnauthorized(true)
            setError(error.response?.data?.message || "No pudimos abrir tu bitácora. Comprueba la conexión.")
        })
        return () => { active.current = false }
    }, [load])

    async function act(action, event) {
        event?.preventDefault()
        if (request.current) return
        request.current = true
        setBusy(true)
        setError("")
        setMessage("")
        try {
            const { data: result } = await axios.post(`${API_URL}/missions/${action}`, {
                day: data.day, ...(action === "submit" ? { answers: data.mission.questions.map((_, index) => Number(answers[index])) } : {})
            }, config())
            if (!active.current) return
            setData(previous => ({ ...previous, progress: result.progress, mission: result.mission || previous.mission }))
            if (action === "claim") {
                setUsuario(previous => previous ? { ...previous, Doblones: result.balance } : previous)
                setMessage(result.alreadyClaimed ? "Esta recompensa ya estaba acreditada. Tu saldo está actualizado." : "¡Recompensa acreditada! Buen trabajo, tripulante.")
            } else {
                setMessage(result.score === 3 ? "¡Tres respuestas correctas! Ya puedes reclamar tu recompensa." : `Acertaste ${result.score} de 3. Repasa las opciones e inténtalo nuevamente.`)
            }
            // Actualiza historial y estadísticas; conserva el resultado si falla esta consulta auxiliar.
            try {
                const { data: updated } = await axios.get(`${API_URL}/missions`, config())
                if (active.current) setData(updated)
            } catch {
                if (active.current) setError("La operación se confirmó, pero no pudimos actualizar el historial. Actualiza la bitácora para consultarlo.")
            }
        } catch (error) {
            if (!active.current) return
            if (error.response?.status === 401) setUnauthorized(true)
            setError(error.response?.data?.message || "No se pudo confirmar la operación. Puedes reintentar sin duplicar la recompensa.")
        } finally {
            request.current = false
            if (active.current) setBusy(false)
        }
    }

    async function refresh() {
        if (busy) return
        setBusy(true)
        setError("")
        setMessage("")
        try { await load() }
        catch { setError("No pudimos actualizar la bitácora. Inténtalo nuevamente.") }
        finally { setBusy(false) }
    }

    if (unauthorized) return <Navigate to="/login" replace />
    const completed = Boolean(data?.progress?.completedAt)
    const claimed = Boolean(data?.progress?.claimedAt)
    const mission = data?.mission

    return <div className="missions-page">
        <Header usuario={usuario} />
        <main className="missions-content">
            <div className="missions-heading">
                <div><span className="missions-kicker">FISHSTACK · TABLÓN DE LA TRIPULACIÓN</span><h1>Bitácora del puerto</h1><p>Aprende sobre el océano. Supera la misión del día. Gana doblones.</p></div>
                <Link className="missions-link" to="/home">← Volver al puerto</Link>
            </div>
            {error && <div className="missions-alert" role="alert">{error} <button type="button" disabled={busy} onClick={refresh}>Actualizar bitácora</button></div>}
            {message && <p className="missions-notice" role="status">{message}</p>}
            {!data && !error && <p role="status">Abriendo tu bitácora…</p>}
            {data && <>
                <section className="missions-stats" aria-label="Tu trayectoria">
                    <article><span>Misiones completadas</span><strong>{number(data.stats.completed)}</strong></article>
                    <article><span>Doblones ganados aquí</span><strong>{number(data.stats.earned)} <img src="/images/Icons/DoblonIcon.png" alt="doblones" /></strong></article>
                    <article><span>Jornada del puerto</span><strong>{new Date(`${data.day}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: data.timezone })}</strong><small>Renueva a las 00:00 de Argentina</small></article>
                </section>
                {!mission && <section className="mission-card"><h2>Mar en calma</h2><p>Hoy no hay una misión disponible. El capitán puede activar desafíos desde Administración.</p></section>}
                {mission && <div className="missions-layout">
                    <section className="mission-card">
                        <div className="mission-card__top"><span className="missions-kicker">MISIÓN DIARIA</span><span className={`mission-badge ${claimed ? "mission-badge--done" : ""}`}>{claimed ? "Recompensa recibida" : completed ? "Completada" : "Por explorar"}</span></div>
                        <h2>{mission.title}</h2><p>{mission.description}</p>
                        <div className="mission-progress"><span>Tu mejor resultado: {data.progress?.bestScore || 0} / 3</span><span>{data.progress?.attempts || 0} intentos</span></div>
                        <progress aria-label="Mejor resultado de la misión" max="3" value={data.progress?.bestScore || 0} />
                        {!completed && <form onSubmit={event => act("submit", event)}>
                            {mission.questions.map((question, index) => <fieldset className="mission-question" disabled={busy} key={index}>
                                <legend><span>{String(index + 1).padStart(2, "0")}</span> {question.text}</legend>
                                {question.options.map((option, optionIndex) => <label key={optionIndex} className={Number(answers[index]) === optionIndex ? "mission-option mission-option--selected" : "mission-option"}>
                                    <input type="radio" name={`question-${index}`} value={optionIndex} required checked={answers[index] === String(optionIndex)} onChange={event => setAnswers(previous => ({ ...previous, [index]: event.target.value }))} />
                                    <span>{option}</span>
                                </label>)}
                            </fieldset>)}
                            <button type="submit" className="mission-button" disabled={busy}>{busy ? "Consultando al capitán…" : "Entregar respuestas"}</button>
                        </form>}
                        {completed && <div className="mission-review">
                            <h3>Conocimiento para tu próxima aventura</h3>
                            {mission.questions.map((question, index) => <article key={index}><strong>{question.text}</strong><p>✓ {question.options[question.correct]}</p><p>{question.explanation}</p></article>)}
                        </div>}
                    </section>
                    <aside className="mission-reward">
                        <span className="missions-kicker">EL TESORO DE HOY</span><img src="/images/Icons/DoblonIcon.png" alt="" /><strong>{number(mission.reward)}</strong><span>doblones</span>
                        <p>Responde correctamente las tres preguntas y reclama el premio una sola vez por jornada.</p>
                        <button className="mission-button" type="button" disabled={busy || !completed || claimed} onClick={() => act("claim")}>{claimed ? "✓ Premio acreditado" : completed ? "Reclamar recompensa" : "Completa la misión"}</button>
                        <small>Tus avances se guardan en tu cuenta. Puedes reintentar sin perder tu mejor resultado.</small>
                        <Link to="/shop" className="missions-link">Visitar la tienda →</Link>
                    </aside>
                </div>}
                <section className="mission-card missions-history">
                    <h2>Últimas jornadas</h2><p>Tu historial personal de las diez jornadas más recientes con actividad.</p>
                    {!data.history.length ? <p>Aún no has zarpado. Tu primera misión te espera arriba.</p> : <div className="missions-table-wrap"><table><thead><tr><th scope="col">Jornada</th><th scope="col">Resultado</th><th scope="col">Intentos</th><th scope="col">Estado</th><th scope="col">Premio</th></tr></thead><tbody>{data.history.map(row => <tr key={row.day}><td>{row.day}</td><td>{row.bestScore} / 3</td><td>{row.attempts}</td><td>{row.claimedAt ? "Reclamado" : row.completedAt ? "Completada" : "En progreso"}</td><td>{number(row.earnedCoins)} doblones</td></tr>)}</tbody></table></div>}
                </section>
            </>}
        </main>
    </div>
}
