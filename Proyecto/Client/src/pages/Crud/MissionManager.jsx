import { useEffect, useState } from "react"
import axios from "axios"
import { API_URL } from "../../config/api"
import "./MissionManager.css"

const emptyQuestion = () => ({ text: "", options: ["", "", ""], correct: 0, explanation: "" })
const emptyMission = () => ({ title: "", description: "", reward: 150, active: true, questions: Array.from({ length: 3 }, emptyQuestion) })
const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })

export default function MissionManager() {
    const [items, setItems] = useState([])
    const [form, setForm] = useState(null)
    const [selectedId, setSelectedId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${API_URL}/admin/missions`, { ...config(), signal: controller.signal }).then(({ data }) => setItems(data))
            .catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || "No se pudieron cargar las misiones.") })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [])

    function questionField(index, field, value) {
        setForm(previous => ({ ...previous, questions: previous.questions.map((question, i) => i === index ? { ...question, [field]: value } : question) }))
    }

    async function save(event) {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError("")
        setMessage("")
        try {
            const { data: saved } = selectedId
                ? await axios.put(`${API_URL}/admin/missions/${selectedId}`, form, config())
                : await axios.post(`${API_URL}/admin/missions`, form, config())
            setItems(previous => selectedId ? previous.map(item => item.id === selectedId ? saved : item) : [...previous, saved])
            setForm(null)
            setSelectedId(null)
            setMessage("Misión guardada. La misión ya publicada de hoy conserva su contenido y recompensa.")
        } catch (error) { setError(error.response?.data?.message || "No se pudo guardar la misión.") }
        finally { setBusy(false) }
    }

    return <section className="crud-manager mission-manager">
        <h2>Misiones del puerto</h2>
        <p>Administra los desafíos que rotan cada día. Cada misión contiene tres preguntas y una recompensa.</p>
        <p>El primer acceso fija la misión del día para toda la tripulación. Las ediciones afectan próximas jornadas; desactivar conserva el historial.</p>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {loading && <p role="status">Cargando misiones…</p>}
        <button type="button" disabled={busy || loading} onClick={() => { setSelectedId(null); setForm(emptyMission()); setError(""); setMessage("") }}>Crear misión</button>
        {!loading && !items.length && <p>No hay misiones cargadas.</p>}
        <div className="mission-manager__list">{items.map(item => <article key={item.id}>
            <div><h3>{item.title}</h3><p>{item.active ? "Activa" : "Inactiva"} · {item.reward} doblones · 3 preguntas</p></div>
            <button type="button" disabled={busy} onClick={() => { setSelectedId(item.id); setForm(structuredClone(item)); setError(""); setMessage("") }}>Editar</button>
        </article>)}</div>
        {form && <form className="mission-manager__form" onSubmit={save}>
            <h3>{selectedId ? "Editar misión" : "Nueva misión"}</h3>
            <fieldset disabled={busy}>
                <label>Título<input value={form.title} maxLength={100} required onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} /></label>
                <label>Descripción<textarea value={form.description} maxLength={500} required onChange={event => setForm(previous => ({ ...previous, description: event.target.value }))} /></label>
                <label>Recompensa (1 a 1000 doblones)<input type="number" min={1} max={1000} step={1} value={form.reward} required onChange={event => setForm(previous => ({ ...previous, reward: Number(event.target.value) }))} /></label>
                <label>Estado<select value={String(form.active)} onChange={event => setForm(previous => ({ ...previous, active: event.target.value === "true" }))}><option value="true">Activa</option><option value="false">Inactiva</option></select></label>
                {form.questions.map((question, index) => <section className="mission-manager__question" key={index}>
                    <h4>Pregunta {index + 1}</h4>
                    <label>Enunciado<input value={question.text} maxLength={240} required onChange={event => questionField(index, "text", event.target.value)} /></label>
                    {question.options.map((option, optionIndex) => <label key={optionIndex}>Opción {optionIndex + 1}<input value={option} maxLength={160} required onChange={event => questionField(index, "options", question.options.map((value, i) => i === optionIndex ? event.target.value : value))} /></label>)}
                    <label>Respuesta correcta<select value={question.correct} onChange={event => questionField(index, "correct", Number(event.target.value))}>{question.options.map((_, i) => <option value={i} key={i}>Opción {i + 1}</option>)}</select></label>
                    <label>Explicación al completar<textarea value={question.explanation} maxLength={500} required onChange={event => questionField(index, "explanation", event.target.value)} /></label>
                </section>)}
                <div className="mission-manager__actions"><button type="submit">{busy ? "Guardando…" : "Guardar misión"}</button><button type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}
    </section>
}
