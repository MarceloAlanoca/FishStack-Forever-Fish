import { useEffect, useRef, useState } from "react"
import axios from "axios"
import CrudModal from "./CrudModal"
import { API_URL } from "../../config/api"

function inputDate(value) {
    const date = new Date(value)
    const day = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0")
    const time = String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0")
    return day + "T" + time
}

const emptyForm = {
    Nombre: "",
    Version: "",
    Tipo: "Actualización",
    Descripcion_Inicial: "",
    Detalle: "",
    Fecha: ""
}

function requestConfig() {
    return { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
}

export default function UpdateManager() {
    const [updates, setUpdates] = useState([])
    const [form, setForm] = useState({ ...emptyForm, Fecha: inputDate(new Date()) })
    const [selectedId, setSelectedId] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [search, setSearch] = useState("")
    const [refresh, setRefresh] = useState(0)
    const [imageFile, setImageFile] = useState(null)
    const [currentImage, setCurrentImage] = useState(null)
    const [preview, setPreview] = useState("")
    const [removeImage, setRemoveImage] = useState(false)
    const fileInput = useRef(null)

    useEffect(() => {
        const controller = new AbortController()
        axios.get(API_URL + "/admin/updates", { ...requestConfig(), signal: controller.signal })
            .then(({ data }) => setUpdates(data))
            .catch((error) => {
                if (!controller.signal.aborted) setError(error.response?.data?.message || "No se pudieron cargar las actualizaciones.")
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [refresh])

    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview) }
    }, [preview])

    function changeField(event) {
        setForm({ ...form, [event.target.name]: event.target.value })
    }

    function clearImageInput() {
        setImageFile(null)
        setPreview("")
        if (fileInput.current) fileInput.current.value = ""
    }

    function fillForm(update) {
        setSelectedId(update.ID_Update)
        setForm({
            Nombre: update.Nombre,
            Version: update.Version,
            Tipo: update.Tipo,
            Descripcion_Inicial: update.Descripcion_Inicial,
            Detalle: update.Detalle,
            Fecha: inputDate(update.Fecha)
        })
        clearImageInput()
        setCurrentImage(update.Imagen)
        setRemoveImage(false)
    }

    function newUpdate() {
        setModalOpen(true)
        setSelectedId(null)
        setForm({ ...emptyForm, Fecha: inputDate(new Date()) })
        clearImageInput()
        setCurrentImage(null)
        setRemoveImage(false)
        setError("")
        setMessage("")
    }

    function chooseImage(event) {
        const file = event.target.files[0]
        setImageFile(null)
        setPreview("")
        if (!file) return
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
            setError("Elige una imagen PNG, JPG o WebP de hasta 5 MB.")
            event.target.value = ""
            return
        }
        setError("")
        setImageFile(file)
        setPreview(URL.createObjectURL(file))
        setRemoveImage(false)
    }

    async function selectUpdate(id) {
        setBusy(true)
        setError("")
        setMessage("")
        try {
            const { data } = await axios.get(API_URL + "/admin/updates/" + id, requestConfig())
            fillForm(data)
            setModalOpen(true)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo seleccionar la actualización.")
        } finally {
            setBusy(false)
        }
    }

    async function saveUpdate(event) {
        event.preventDefault()
        setBusy(true)
        setError("")
        setMessage("")
        try {
            const body = new FormData()
            body.append("Nombre", form.Nombre)
            body.append("Version", form.Version)
            body.append("Tipo", form.Tipo)
            body.append("Descripcion_Inicial", form.Descripcion_Inicial)
            body.append("Detalle", form.Detalle)
            body.append("Fecha", new Date(form.Fecha).toISOString())
            body.append("Quitar_Imagen", String(removeImage))
            if (imageFile) body.append("Imagen", imageFile)

            let response
            if (selectedId === null) {
                response = await axios.post(API_URL + "/admin/updates", body, requestConfig())
                setUpdates([response.data, ...updates])
                setMessage("Publicación creada. Ya está disponible en Logs.")
            } else {
                response = await axios.put(API_URL + "/admin/updates/" + selectedId, body, requestConfig())
                setUpdates(updates.map((update) => update.ID_Update === selectedId ? response.data : update))
                setMessage("Publicación actualizada. Los cambios se verán al abrir Logs.")
            }
            fillForm(response.data)
            setModalOpen(false)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo guardar la publicación. Revisa también la fecha.")
        } finally {
            setBusy(false)
        }
    }

    async function deleteUpdate() {
        if (!window.confirm("¿Eliminar la publicación " + form.Nombre + "? Esta acción no se puede deshacer.")) return
        setBusy(true)
        setError("")
        setMessage("")
        try {
            await axios.delete(API_URL + "/admin/updates/" + selectedId, requestConfig())
            setUpdates(updates.filter((update) => update.ID_Update !== selectedId))
            newUpdate()
            setMessage("Publicación eliminada.")
            setModalOpen(false)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo eliminar la publicación.")
        } finally {
            setBusy(false)
        }
    }

    const filteredUpdates = updates.filter((update) => {
        const text = update.ID_Update + " " + update.Nombre + " " + update.Version + " " + update.Tipo
        return text.toLowerCase().includes(search.toLowerCase())
    })
    const imageSource = preview || (!removeImage && currentImage ? API_URL + currentImage : "")

    return (
        <section className="crud-manager" aria-labelledby="crud-updates-title">
            <div className="crud-section-title">
                <div>
                    <h2 id="crud-updates-title">Actualizaciones / Logs</h2>
                    <p>Publica novedades con texto e imagen.</p>
                </div>
                <button type="button" onClick={newUpdate} disabled={busy || loading}>Nueva publicación</button>
            </div>
            {!modalOpen && error && <p className="crud-feedback crud-feedback--error" role="alert">{error}</p>}
            {message && <p className="crud-feedback" role="status">{message}</p>}
            <div className="crud-manager-layout">
                <div className="crud-record-list">
                    <div className="crud-record-tools">
                        <label htmlFor="crud-update-search">Buscar publicación</label>
                        <input id="crud-update-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, título, versión o tipo" />
                        <button type="button" disabled={busy || loading} onClick={() => {
                            setLoading(true)
                            setError("")
                            setRefresh(refresh + 1)
                        }}>Actualizar lista</button>
                    </div>
                    <div className="crud-table-scroll" tabIndex="0" role="region" aria-label="Tabla de actualizaciones" aria-busy={loading}>
                        <table className="crud-table">
                            <caption>{loading ? "Cargando publicaciones..." : updates.length + " publicaciones"}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Título</th>
                                    <th scope="col">Versión</th>
                                    <th scope="col">Tipo</th>
                                    <th scope="col">Fecha</th>
                                    <th scope="col">Imagen</th>
                                    <th scope="col">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && filteredUpdates.map((update) => (
                                    <tr key={update.ID_Update} className={update.ID_Update === selectedId ? "crud-table-selected" : ""}>
                                        <td>{update.ID_Update}</td>
                                        <td>{update.Nombre}</td>
                                        <td>{update.Version}</td>
                                        <td>{update.Tipo}</td>
                                        <td>{new Date(update.Fecha).toLocaleDateString("es-AR")}</td>
                                        <td>{update.Imagen ? "Sí" : "No"}</td>
                                        <td>
                                            <button type="button" disabled={busy} onClick={() => selectUpdate(update.ID_Update)}>
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredUpdates.length === 0 && <tr><td colSpan="7">No se encontraron publicaciones.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                {modalOpen && (
                    <CrudModal
                        title={selectedId === null ? "Crear publicación" : "Editar publicación #" + selectedId}
                        busy={busy}
                        error={error}
                        onClose={() => {
                            setModalOpen(false)
                            setError("")
                        }}
                    >
                        <form className="crud-record-form" onSubmit={saveUpdate}>
                            <fieldset disabled={busy || loading}>
                                <label>
                                    Título
                                    <input name="Nombre" value={form.Nombre} onChange={changeField} maxLength="100" required />
                                </label>
                                <label>
                                    Versión
                                    <input name="Version" value={form.Version} onChange={changeField} maxLength="40" placeholder="Por ejemplo: 0.2.0" required />
                                </label>
                                <label>
                                    Tipo
                                    <input name="Tipo" value={form.Tipo} onChange={changeField} maxLength="40" placeholder="Actualización, corrección, anuncio..." required />
                                </label>
                                <label>
                                    Fecha y hora
                                    <input name="Fecha" type="datetime-local" min="1000-01-01T00:00" max="9999-12-31T23:59" value={form.Fecha} onChange={changeField} required />
                                </label>
                                <label>
                                    Resumen (hasta 200 caracteres)
                                    <textarea name="Descripcion_Inicial" rows="3" value={form.Descripcion_Inicial} onChange={changeField} maxLength="200" required />
                                </label>
                                <label>
                                    Texto completo (hasta 15.000 caracteres)
                                    <textarea name="Detalle" rows="10" value={form.Detalle} onChange={changeField} maxLength="15000" required />
                                </label>
                                <p className="crud-form-help">Puedes separar los párrafos con saltos de línea.</p>
                                <label>
                                    Imagen opcional
                                    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} />
                                </label>
                                <p className="crud-form-help">PNG, JPG o WebP de hasta 5 MB. Si no eliges otra imagen, se conserva la actual.</p>
                                {imageSource && <img className="crud-image-preview" src={imageSource} alt="Vista previa de la publicación" />}
                                {imageFile && <p className="crud-form-help">Imagen elegida: {imageFile.name}</p>}
                                {currentImage && (
                                    <label className="crud-check-label">
                                        <input type="checkbox" checked={removeImage} onChange={(event) => {
                                            setRemoveImage(event.target.checked)
                                            if (event.target.checked) clearImageInput()
                                        }} />
                                        Quitar imagen actual
                                    </label>
                                )}
                                <div className="crud-form-actions">
                                    <button type="submit">{busy ? "Guardando..." : selectedId === null ? "Crear publicación" : "Guardar cambios"}</button>
                                    {selectedId !== null && <button className="crud-delete" type="button" onClick={deleteUpdate}>Eliminar publicación</button>}
                                </div>
                            </fieldset>
                        </form>
                    </CrudModal>
                )}
            </div>
        </section>
    )
}
