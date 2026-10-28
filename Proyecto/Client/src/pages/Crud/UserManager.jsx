import { useEffect, useState } from "react"
import axios from "axios"
import CrudModal from "./CrudModal"
import { API_URL } from "../../config/api"

const emptyForm = {
    Nombre: "",
    Apellido: "",
    Correo: "",
    Usuario: "",
    Contraseña: "",
    Rol: "Usuario",
    Doblones: 0,
    isActive: true
}

function requestConfig() {
    return { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
}

export default function UserManager({ currentUser, onCurrentUserChange }) {
    const [users, setUsers] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [selectedId, setSelectedId] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [refresh, setRefresh] = useState(0)
    const [search, setSearch] = useState("")

    useEffect(() => {
        const controller = new AbortController()
        axios.get(API_URL + "/admin/users", { ...requestConfig(), signal: controller.signal })
            .then(({ data }) => setUsers(data))
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setError(error.response?.data?.message || "No se pudieron cargar los usuarios.")
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [refresh])

    function changeField(event) {
        const { name, value } = event.target
        setForm({ ...form, [name]: name === "isActive" ? value === "true" : value })
    }

    function reloadUsers() {
        setLoading(true)
        setError("")
        setRefresh(refresh + 1)
    }

    function newUser() {
        setModalOpen(true)
        setSelectedId(null)
        setForm(emptyForm)
        setError("")
        setMessage("")
    }

    async function selectUser(id) {
        setBusy(true)
        setError("")
        setMessage("")
        try {
            const { data } = await axios.get(API_URL + "/admin/users/" + id, requestConfig())
            setSelectedId(data.ID_Usuario)
            setForm({
                Nombre: data.Nombre || "",
                Apellido: data.Apellido || "",
                Correo: data.Correo || "",
                Usuario: data.Usuario,
                Contraseña: "",
                Rol: data.Rol?.toLowerCase() === "administrador" ? "Administrador" : "Usuario",
                Doblones: data.Doblones ?? 0,
                isActive: data.isActive
            })
            setModalOpen(true)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo seleccionar el usuario.")
        } finally {
            setBusy(false)
        }
    }

    async function saveUser(event) {
        event.preventDefault()
        setBusy(true)
        setError("")
        setMessage("")
        try {
            let response
            const body = { ...form, Doblones: Number(form.Doblones) }
            if (selectedId === null) {
                response = await axios.post(API_URL + "/admin/users", body, requestConfig())
                setUsers([...users, response.data])
                setMessage("Usuario creado correctamente.")
            } else {
                response = await axios.put(API_URL + "/admin/users/" + selectedId, body, requestConfig())
                setUsers(users.map((user) => user.ID_Usuario === selectedId ? response.data : user))
                setMessage("Usuario actualizado correctamente.")
            }
            if (response.data.ID_Usuario === currentUser.ID_Usuario) {
                onCurrentUserChange(response.data)
            }
            setSelectedId(response.data.ID_Usuario)
            setForm({
                Nombre: response.data.Nombre,
                Apellido: response.data.Apellido,
                Correo: response.data.Correo,
                Usuario: response.data.Usuario,
                Contraseña: "",
                Rol: response.data.Rol,
                Doblones: response.data.Doblones,
                isActive: response.data.isActive
            })
            setModalOpen(false)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo guardar el usuario.")
        } finally {
            setBusy(false)
        }
    }

    async function deleteUser() {
        if (!window.confirm("¿Eliminar al usuario " + form.Usuario + "? Sus datos se conservaran y no podra iniciar sesion.")) return
        setBusy(true)
        setError("")
        setMessage("")
        try {
            await axios.delete(API_URL + "/admin/users/" + selectedId, requestConfig())
            setUsers(users.map((user) => user.ID_Usuario === selectedId ? { ...user, isActive: false } : user))
            setSelectedId(null)
            setForm(emptyForm)
            setMessage("Cuenta eliminada correctamente.")
            setModalOpen(false)
        } catch (error) {
            setError(error.response?.data?.message || "No se pudo desactivar la cuenta.")
        } finally {
            setBusy(false)
        }
    }

    const filteredUsers = users.filter((user) => {
        const text = user.ID_Usuario + " " + user.Usuario + " " + user.Nombre + " " + user.Apellido + " " + user.Correo
        return text.toLowerCase().includes(search.toLowerCase())
    })
    const ownAccount = selectedId === currentUser.ID_Usuario

    return (
        <section className="crud-manager" aria-labelledby="crud-users-title">
            <div className="crud-section-title">
                <div>
                    <h2 id="crud-users-title">Usuarios</h2>
                    <p>Consulta las cuentas o aprieta Editar para cambiar sus datos.</p>
                </div>
                <button type="button" onClick={newUser} disabled={busy || loading}>Nuevo usuario</button>
            </div>

            {!modalOpen && error && <p className="crud-feedback crud-feedback--error" role="alert">{error}</p>}
            {message && <p className="crud-feedback" role="status">{message}</p>}

            <div className="crud-manager-layout">
                <div className="crud-record-list">
                    <div className="crud-record-tools">
                        <label htmlFor="crud-search">Buscar usuario</label>
                        <input id="crud-search" type="search" placeholder="ID, usuario, nombre o correo" value={search} onChange={(event) => setSearch(event.target.value)} />
                        <button type="button" disabled={busy || loading} onClick={reloadUsers}>Actualizar lista</button>
                    </div>
                    <div className="crud-table-scroll" tabIndex="0" role="region" aria-label="Tabla de usuarios" aria-busy={loading}>
                        <table className="crud-table">
                            <caption>{loading ? "Cargando usuarios..." : users.length + " cuentas registradas"}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Usuario</th>
                                    <th scope="col">Nombre</th>
                                    <th scope="col">Apellido</th>
                                    <th scope="col">Correo</th>
                                    <th scope="col">Rol</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Doblones</th>
                                    <th scope="col">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && filteredUsers.map((user) => (
                                    <tr key={user.ID_Usuario} className={user.ID_Usuario === selectedId ? "crud-table-selected" : ""}>
                                        <td>{user.ID_Usuario}</td>
                                        <td>{user.Usuario}</td>
                                        <td>{user.Nombre}</td>
                                        <td>{user.Apellido}</td>
                                        <td>{user.Correo || "Sin correo"}</td>
                                        <td>{user.Rol}</td>
                                        <td>{user.isActive ? "Activa" : "Inactiva"}</td>
                                        <td>{user.Doblones ?? 0}</td>
                                        <td><button type="button" disabled={busy} onClick={() => selectUser(user.ID_Usuario)}>Editar</button></td>
                                    </tr>
                                ))}
                                {!loading && filteredUsers.length === 0 && <tr><td colSpan="9">No se encontraron usuarios.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {modalOpen && (
                    <CrudModal
                        title={selectedId === null ? "Crear usuario" : "Editar usuario #" + selectedId}
                        busy={busy}
                        error={error}
                        onClose={() => {
                            setModalOpen(false)
                            setError("")
                        }}
                    >
                        <form className="crud-record-form" onSubmit={saveUser}>
                            <fieldset disabled={busy || loading}>
                                <label>
                                    Nombre
                                    <input name="Nombre" value={form.Nombre} onChange={changeField} maxLength="255" required />
                                </label>
                                <label>
                                    Apellido
                                    <input name="Apellido" value={form.Apellido} onChange={changeField} maxLength="255" required />
                                </label>
                                <label>
                                    Correo
                                    <input name="Correo" type="email" value={form.Correo} onChange={changeField} maxLength="255" required />
                                </label>
                                <label>
                                    Usuario
                                    <input name="Usuario" value={form.Usuario} onChange={changeField} minLength="3" maxLength="255" autoComplete="off" required />
                                </label>
                                <label>
                                    {selectedId === null ? "Contraseña" : "Nueva contraseña (opcional)"}
                                    <input name="Contraseña" type="password" value={form.Contraseña} onChange={changeField} minLength="6" autoComplete="new-password" required={selectedId === null} />
                                </label>
                                {selectedId !== null && <p className="crud-form-help">Deja la contraseña vacía para conservar la actual.</p>}
                                <label>
                                    Rol
                                    <select name="Rol" value={form.Rol} onChange={changeField} disabled={ownAccount}>
                                        <option value="Usuario">Usuario</option>
                                        <option value="Administrador">Administrador</option>
                                    </select>
                                </label>
                                <label>
                                    Estado de la cuenta
                                    <select name="isActive" value={String(form.isActive)} onChange={changeField} disabled={ownAccount}>
                                        <option value="true">Activa</option>
                                        <option value="false">Inactiva</option>
                                    </select>
                                </label>
                                <label>
                                    Doblones
                                    <input name="Doblones" type="number" min="0" max="2147483647" step="1" required value={form.Doblones} onChange={changeField} />
                                </label>
                                <div className="crud-form-actions">
                                    <button type="submit">{busy ? "Guardando..." : selectedId === null ? "Crear usuario" : "Guardar cambios"}</button>
                                    {selectedId !== null && <button className="crud-delete" type="button" onClick={deleteUser} disabled={ownAccount}>Eliminar cuenta</button>}
                                </div>
                                {ownAccount && <p className="crud-form-help">Estás editando tu cuenta. Puedes cambiar tus datos, pero no eliminarla ni quitarte el rol de administrador.</p>}
                            </fieldset>
                        </form>
                    </CrudModal>
                )}
            </div>
        </section>
    )
}
