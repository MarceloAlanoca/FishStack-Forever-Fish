import { useEffect, useState } from "react"
import axios from "axios"
import CrudModal from "./CrudModal"
import { API_URL } from "../../config/api"

const emptyForm = {
    Nombre: "",
    Descripcion: "",
    Tipo: "Doblones",
    Precio: "",
    Doblones: ""
}

function requestConfig() {
    return { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
}

export default function ArticleManager() {
    const [articles, setArticles] = useState([])
    const [form, setForm] = useState(emptyForm)
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
        axios.get(API_URL + "/admin/articles", { ...requestConfig(), signal: controller.signal })
            .then(({ data }) => setArticles(data))
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setError(error.response?.data?.message || "No se pudieron cargar los artículos.")
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [refresh])

    function changeField(event) {
        setForm({ ...form, [event.target.name]: event.target.value })
    }

    function fillForm(article) {
        setSelectedId(article.ID_Pass)
        setForm({
            Nombre: article.Nombre,
            Descripcion: article.Descripcion || "",
            Tipo: article.Tipo,
            Precio: article.Precio ?? 0,
            Doblones: article.Doblones ?? 0
        })
    }

    function newArticle() {
        setModalOpen(true)
        setSelectedId(null)
        setForm(emptyForm)
        setError("")
        setMessage("")
    }

    function reloadArticles() {
        setLoading(true)
        setError("")
        setRefresh(refresh + 1)
    }

    async function selectArticle(id) {
        setBusy(true)
        setError("")
        setMessage("")
        try {
            const { data } = await axios.get(API_URL + "/admin/articles/" + id, requestConfig())
            fillForm(data)
            setModalOpen(true)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo seleccionar el artículo.")
        } finally {
            setBusy(false)
        }
    }

    async function saveArticle(event) {
        event.preventDefault()
        setBusy(true)
        setError("")
        setMessage("")
        const body = { ...form, Precio: Number(form.Precio), Doblones: Number(form.Doblones) }
        try {
            let response
            if (selectedId === null) {
                response = await axios.post(API_URL + "/admin/articles", body, requestConfig())
                setArticles([...articles, response.data])
                setMessage("Artículo creado. Ya está disponible en Shop.")
            } else {
                response = await axios.put(API_URL + "/admin/articles/" + selectedId, body, requestConfig())
                setArticles(articles.map((article) => article.ID_Pass === selectedId ? response.data : article))
                setMessage("Artículo actualizado. Los cambios se verán al abrir Shop.")
            }
            fillForm(response.data)
            setModalOpen(false)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo guardar el artículo.")
        } finally {
            setBusy(false)
        }
    }

    async function deleteArticle() {
        if (!window.confirm("¿Eliminar el artículo " + form.Nombre + "? Esta acción no se puede deshacer.")) return
        setBusy(true)
        setError("")
        setMessage("")
        try {
            await axios.delete(API_URL + "/admin/articles/" + selectedId, requestConfig())
            setArticles(articles.filter((article) => article.ID_Pass !== selectedId))
            setSelectedId(null)
            setForm(emptyForm)
            setMessage("Artículo eliminado de la tienda.")
            setModalOpen(false)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo eliminar el artículo.")
        } finally {
            setBusy(false)
        }
    }

    const filteredArticles = articles.filter((article) => {
        const text = article.ID_Pass + " " + article.Nombre + " " + article.Tipo
        return text.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <section className="crud-manager" aria-labelledby="crud-articles-title">
            <div className="crud-section-title">
                <div>
                    <h2 id="crud-articles-title">Artículos de Shop</h2>
                    <p>Crea y edita los pases que aparecen en la tienda.</p>
                </div>
                <button type="button" onClick={newArticle} disabled={busy || loading}>
                    Nuevo artículo
                </button>
            </div>

            {!modalOpen && error && <p className="crud-feedback crud-feedback--error" role="alert">{error}</p>}
            {message && <p className="crud-feedback" role="status">{message}</p>}

            <div className="crud-manager-layout">
                <div className="crud-record-list">
                    <div className="crud-record-tools">
                        <label htmlFor="crud-article-search">Buscar artículo</label>
                        <input
                            id="crud-article-search"
                            type="search"
                            placeholder="ID, nombre o tipo"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <button type="button" onClick={reloadArticles} disabled={busy || loading}>
                            Actualizar lista
                        </button>
                    </div>
                    <div className="crud-table-scroll" tabIndex="0" role="region" aria-label="Tabla de artículos" aria-busy={loading}>
                        <table className="crud-table">
                            <caption>{loading ? "Cargando artículos..." : articles.length + " artículos registrados"}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Nombre</th>
                                    <th scope="col">Tipo</th>
                                    <th scope="col">Doblones</th>
                                    <th scope="col">Precio (ARS)</th>
                                    <th scope="col">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && filteredArticles.map((article) => (
                                    <tr key={article.ID_Pass} className={article.ID_Pass === selectedId ? "crud-table-selected" : ""}>
                                        <td>{article.ID_Pass}</td>
                                        <td>{article.Nombre}</td>
                                        <td>{article.Tipo}</td>
                                        <td>{article.Doblones}</td>
                                        <td>${Number(article.Precio || 0).toLocaleString("es-AR")}</td>
                                        <td>
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => selectArticle(article.ID_Pass)}
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredArticles.length === 0 && (
                                    <tr><td colSpan="6">No se encontraron artículos.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {modalOpen && (
                    <CrudModal
                        title={selectedId === null ? "Crear artículo" : "Editar artículo #" + selectedId}
                        busy={busy}
                        error={error}
                        onClose={() => {
                            setModalOpen(false)
                            setError("")
                        }}
                    >
                        <form className="crud-record-form" onSubmit={saveArticle}>
                            <fieldset disabled={busy || loading}>
                                <label>
                                    Nombre
                                    <input name="Nombre" value={form.Nombre} onChange={changeField} maxLength="255" required />
                                </label>
                                <label>
                                    Tipo
                                    <input name="Tipo" value={form.Tipo} onChange={changeField} maxLength="40" required />
                                </label>
                                <label>
                                    Doblones
                                    <input name="Doblones" type="number" min="0" max="2147483647" step="1" value={form.Doblones} onChange={changeField} required />
                                </label>
                                <label>
                                    Precio en pesos argentinos
                                    <input name="Precio" type="number" min="0" max="2147483647" step="1" value={form.Precio} onChange={changeField} required />
                                </label>
                                <label>
                                    Descripción
                                    <textarea name="Descripcion" rows="8" maxLength="15000" value={form.Descripcion} onChange={changeField} required />
                                </label>
                                <p className="crud-form-help">Puedes escribir varios párrafos. La tienda conserva los saltos de línea.</p>
                                <div className="crud-form-actions">
                                    <button type="submit">
                                        {busy ? "Guardando..." : selectedId === null ? "Crear artículo" : "Guardar cambios"}
                                    </button>
                                    {selectedId !== null && (
                                        <button className="crud-delete" type="button" onClick={deleteArticle}>
                                            Eliminar artículo
                                        </button>
                                    )}
                                </div>
                            </fieldset>
                        </form>
                    </CrudModal>
                )}
            </div>
        </section>
    )
}
