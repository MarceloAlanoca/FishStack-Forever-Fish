import { useEffect, useState } from "react"
import axios from "axios"
import CrudModal from "./CrudModal"
import { API_URL } from "../../config/api"

const commonFields = [
    { name: "nombre", label: "Nombre", max: 100 },
    { name: "orden", label: "Orden de aparición (empieza en 0)", type: "number" },
    { name: "descripcion", label: "Descripción", textarea: true, max: 15000 }
]
const sections = {
    integrantes: {
        title: "Integrantes", singular: "integrante",
        fields: [...commonFields,
            { name: "rol", label: "Rol", max: 100 },
            { name: "detalle", label: "Detalle", textarea: true, max: 15000, optional: true },
            { name: "aporte", label: "Aporte al proyecto", textarea: true, max: 15000, optional: true },
            { name: "imagen", label: "Ruta o URL de la imagen", max: 2048 },
            { name: "video", label: "Ruta o URL del video de fondo", max: 2048 }
        ]
    },
    inspiraciones: {
        title: "Inspiraciones", singular: "inspiración",
        fields: [...commonFields,
            { name: "inspiracion", label: "¿Por qué nos inspiró?", textarea: true, max: 15000 },
            { name: "clase", label: "Clase de estilo", max: 100 },
            { name: "portada", label: "Ruta o URL de la portada", max: 2048 },
            { name: "video", label: "Ruta o URL del gameplay", max: 2048 },
            { name: "segundoInicio", label: "Segundo inicial del video", type: "number" },
            { name: "link", label: "Enlace al juego (HTTP/HTTPS)", type: "url", max: 2048 }
        ]
    }
}

function requestConfig() {
    return { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
}

export default function CreditManager({ type }) {
    const section = sections[type]
    const endpoint = API_URL + "/admin/credits/" + type
    const [records, setRecords] = useState([])
    const [form, setForm] = useState({})
    const [selectedId, setSelectedId] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [search, setSearch] = useState("")
    const [refresh, setRefresh] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        axios.get(endpoint, { ...requestConfig(), signal: controller.signal })
            .then(({ data }) => setRecords(data))
            .catch((failure) => {
                if (!controller.signal.aborted) setError(failure.response?.data?.message || "No se pudieron cargar los créditos.")
            })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [endpoint, refresh])

    function openForm(record = null) {
        const values = {}
        let nextOrder = 0
        for (let i = 0; i < records.length; i++) nextOrder = Math.max(nextOrder, records[i].orden + 1)
        for (let i = 0; i < section.fields.length; i++) {
            const field = section.fields[i]
            values[field.name] = record?.[field.name] ?? (field.type === "number" ? 0 : "")
        }
        if (!record) values.orden = nextOrder
        setForm(values)
        setSelectedId(record?.id ?? null)
        setError("")
        setMessage("")
        setModalOpen(true)
    }

    async function saveRecord(event) {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError("")
        const body = { ...form, orden: Number(form.orden) }
        if (type === "inspiraciones") body.segundoInicio = Number(form.segundoInicio)
        try {
            const { data } = selectedId === null
                ? await axios.post(endpoint, body, requestConfig())
                : await axios.put(endpoint + "/" + selectedId, body, requestConfig())
            setRecords(selectedId === null ? [...records, data] : records.map((record) => record.id === selectedId ? data : record))
            setMessage("Cambios guardados. Se verán al abrir la página de Créditos.")
            setModalOpen(false)
        } catch (failure) {
            setError(failure.response?.data?.message || "No se pudieron guardar los cambios.")
        } finally { setBusy(false) }
    }

    async function deleteRecord() {
        if (busy || !window.confirm("¿Eliminar a " + form.nombre + " de los créditos?")) return
        setBusy(true)
        setError("")
        try {
            await axios.delete(endpoint + "/" + selectedId, requestConfig())
            setRecords(records.filter((record) => record.id !== selectedId))
            setMessage("Registro eliminado de los créditos.")
            setModalOpen(false)
        } catch (failure) {
            setError(failure.response?.data?.message || "No se pudo eliminar el registro.")
        } finally { setBusy(false) }
    }

    const visibleRecords = records.filter((record) =>
        `${record.id} ${record.nombre} ${record.rol || record.clase}`.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.orden - b.orden || a.id - b.id)

    return (
        <section className="crud-manager" aria-labelledby="crud-credits-title">
            <div className="crud-section-title">
                <div><h2 id="crud-credits-title">{section.title}</h2><p>Administrá el contenido que aparece en Créditos.</p></div>
                <button type="button" disabled={busy || loading} onClick={() => openForm()}>Crear {section.singular}</button>
            </div>
            {!modalOpen && error && <p className="crud-feedback crud-feedback--error" role="alert">{error}</p>}
            {message && <p className="crud-feedback" role="status">{message}</p>}
            <div className="crud-record-list">
                <div className="crud-record-tools">
                    <label htmlFor="crud-credit-search">Buscar {section.singular}</label>
                    <input id="crud-credit-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, nombre, rol o estilo" />
                    <button type="button" disabled={busy || loading} onClick={() => {
                        setLoading(true)
                        setError("")
                        setRefresh((current) => current + 1)
                    }}>Actualizar lista</button>
                </div>
                <div className="crud-table-scroll" tabIndex="0" role="region" aria-label={"Tabla de " + section.title.toLowerCase()} aria-busy={loading}>
                    <table className="crud-table">
                        <caption>{loading ? "Cargando..." : records.length + " registros"}</caption>
                        <thead><tr>
                            <th scope="col">ID</th><th scope="col">Nombre</th>
                            <th scope="col">{type === "integrantes" ? "Rol" : "Estilo"}</th>
                            <th scope="col">Orden</th><th scope="col">Acción</th>
                        </tr></thead>
                        <tbody>
                            {!loading && visibleRecords.map((record) => <tr key={record.id}>
                                <td>{record.id}</td><td>{record.nombre}</td><td>{record.rol || record.clase}</td><td>{record.orden}</td>
                                <td><button type="button" disabled={busy} onClick={() => openForm(record)}>Editar</button></td>
                            </tr>)}
                            {!loading && visibleRecords.length === 0 && <tr><td colSpan="5">No se encontraron registros.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            {modalOpen && <CrudModal title={(selectedId === null ? "Crear " : "Editar ") + section.singular}
                busy={busy} error={error} onClose={() => { setModalOpen(false); setError("") }}>
                <form className="crud-record-form" onSubmit={saveRecord}>
                    <fieldset disabled={busy}>
                        {section.fields.map((field) => <label key={field.name}>
                            {field.label}
                            {field.textarea ? <textarea name={field.name} rows="4" maxLength={field.max} required={!field.optional}
                                value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />
                                : <input name={field.name} type={field.type || "text"} maxLength={field.max}
                                    min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? 2147483647 : undefined}
                                    step={field.type === "number" ? 1 : undefined} required value={form[field.name]}
                                    onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />}
                        </label>)}
                        <p className="crud-form-help">Para imágenes y videos usá rutas existentes, como /images/Integrantes/Thiago.jpg, o una URL HTTP/HTTPS.</p>
                        {type === "inspiraciones" && <p className="crud-form-help">La clase de estilo corresponde a un estilo existente, como nullscape o tboi. Otros nombres usan el estilo general.</p>}
                        <div className="crud-form-actions">
                            <button type="submit">{busy ? "Guardando..." : "Guardar cambios"}</button>
                            {selectedId !== null && <button className="crud-delete" type="button" onClick={deleteRecord}>Eliminar {section.singular}</button>}
                        </div>
                    </fieldset>
                </form>
            </CrudModal>}
        </section>
    )
}
