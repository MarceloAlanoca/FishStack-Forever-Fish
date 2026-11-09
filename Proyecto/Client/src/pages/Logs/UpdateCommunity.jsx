import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Avatar from '../../components/Avatar/Avatar'
import { API_URL } from '../../config/api'

const dateFormat = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires'
})

function CommentEditor({ initialText = '', editing = false, disabled, onSave, onCancel }) {
    const [text, setText] = useState(initialText)
    async function submit(event) {
        event.preventDefault()
        if (await onSave(text)) setText('')
    }
    return <form className="logs-comment-form" onSubmit={submit}>
        <label>
            {editing ? 'Editar tu comentario' : 'Escribe un comentario'}
            <textarea value={text} onChange={event => setText(event.target.value)}
                maxLength={1000} required rows={3} disabled={disabled} />
        </label>
        <div className="logs-comment-form__footer">
            <small>{text.length}/1000</small>
            <div>
                {editing && <button type="button" onClick={onCancel} disabled={disabled}>Cancelar</button>}
                <button type="submit" disabled={disabled || !text.trim()}>
                    {disabled ? 'Guardando…' : editing ? 'Guardar cambios' : 'Publicar comentario'}
                </button>
            </div>
        </div>
    </form>
}

export default function UpdateCommunity({ id, onCountsChange }) {
    const [community, setCommunity] = useState(null)
    const [loadError, setLoadError] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [retry, setRetry] = useState(0)
    const [viewer, setViewer] = useState(null)
    const [session, setSession] = useState('loading')
    const [liked, setLiked] = useState(false)
    const [busy, setBusy] = useState('')
    const pending = useRef(false)
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const likeCount = community?.likeCount
    const commentCount = community?.commentCount

    useEffect(() => {
        if (likeCount !== undefined && commentCount !== undefined) {
            onCountsChange?.(id, { likeCount, commentCount })
        }
    }, [id, likeCount, commentCount, onCountsChange])

    useEffect(() => {
        const controller = new AbortController()
        axios.get(`${API_URL}/updates/${id}/community`, { signal: controller.signal })
            .then(({ data }) => { setCommunity(data); setLoadError('') })
            .catch(error => {
                if (!controller.signal.aborted) setLoadError(error.response?.data?.message || 'No se pudieron cargar los comentarios y Me gusta.')
            })
        return () => controller.abort()
    }, [id, retry])

    useEffect(() => {
        const controller = new AbortController()
        const token = localStorage.getItem('token')
        // Una cuenta sin sesión conserva la lectura pública de las novedades y comentarios.
        const load = async () => {
            if (!token) { setSession('anonymous'); return }
            try {
                const config = { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } }
                const [account, like] = await Promise.all([
                    axios.get(`${API_URL}/me`, config),
                    axios.get(`${API_URL}/updates/${id}/like`, config)
                ])
                if (controller.signal.aborted) return
                setViewer(account.data)
                setLiked(like.data.liked)
                setSession('ready')
            } catch (error) {
                if (!controller.signal.aborted) setSession([401, 403].includes(error.response?.status) ? 'expired' : 'error')
            }
        }
        load()
        return () => controller.abort()
    }, [id, retry])

    async function runAction(key, action) {
        if (pending.current) return false
        pending.current = true
        setBusy(key)
        setError('')
        setNotice('')
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            await action(config)
            return true
        } catch (error) {
            if (error.response?.status === 401 ||
                (error.response?.status === 403 && error.response?.data?.message === 'Token invalido o expirado')) {
                setSession('expired')
                setViewer(null)
            }
            setError(error.response?.data?.message || 'No se pudo completar la operación. Comprueba la conexión e intenta nuevamente.')
            return false
        } finally {
            pending.current = false
            setBusy('')
        }
    }

    async function toggleLike() {
        await runAction('like', async config => {
            const { data } = await axios.request({ ...config, url: `${API_URL}/updates/${id}/like`, method: liked ? 'delete' : 'put' })
            setLiked(data.liked)
            setCommunity(current => ({ ...current, likeCount: data.likeCount }))
            setNotice(data.liked ? 'Marcaste Me gusta.' : 'Quitaste tu Me gusta.')
        })
    }

    async function saveComment(text, commentId) {
        return runAction('comment', async config => {
            if (commentId) {
                const { data } = await axios.patch(`${API_URL}/updates/${id}/comments/${commentId}`, { Texto: text }, config)
                setCommunity(current => ({ ...current, comments: current.comments.map(comment => comment.ID_Comentario === commentId ? data.comment : comment) }))
                setEditing(null)
                setNotice('Comentario actualizado.')
            } else {
                const { data } = await axios.post(`${API_URL}/updates/${id}/comments`, { Texto: text }, config)
                setCommunity(current => ({ ...current, comments: [data.comment, ...current.comments], commentCount: data.commentCount }))
                setNotice('Comentario publicado.')
            }
        })
    }

    async function deleteComment(commentId) {
        await runAction('delete', async config => {
            const { data } = await axios.delete(`${API_URL}/updates/${id}/comments/${commentId}`, config)
            setCommunity(current => ({ ...current, comments: current.comments.filter(comment => comment.ID_Comentario !== commentId), commentCount: data.commentCount }))
            setDeleting(null)
            if (editing === commentId) setEditing(null)
            setNotice('Comentario eliminado.')
        })
    }

    async function loadMore() {
        await runAction('more', async () => {
            const { data } = await axios.get(`${API_URL}/updates/${id}/community`, { params: { before: community.nextCursor } })
            setCommunity(current => ({ ...current, commentCount: data.commentCount, nextCursor: data.nextCursor,
                comments: [...current.comments, ...data.comments.filter(comment => !current.comments.some(item => item.ID_Comentario === comment.ID_Comentario))] }))
        })
    }

    return <section className="logs-community" aria-label="Comentarios y Me gusta">
        {loadError ? <div role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button>
        </div> : !community ? <p role="status">Cargando comentarios y Me gusta…</p> : <>
            <div className="logs-community__likes">
                <button type="button" className={liked && session === 'ready' ? 'logs-like logs-like--active' : 'logs-like'}
                    aria-pressed={liked && session === 'ready'} disabled={session !== 'ready' || Boolean(busy)} onClick={toggleLike}>
                    <span aria-hidden="true">{liked && session === 'ready' ? '♥' : '♡'}</span>
                    {busy === 'like' ? 'Guardando…' : liked && session === 'ready' ? 'Te gusta' : 'Me gusta'}
                </button>
                <span>{community.likeCount} Me gusta</span>
            </div>
            <h3>Comentarios ({community.commentCount})</h3>
            {session === 'loading' && <p role="status">Comprobando tu sesión…</p>}
            {(session === 'anonymous' || session === 'expired') && <p className="logs-community__login">
                {session === 'expired' ? 'Tu sesión venció. ' : ''}<Link to="/login">Inicia sesión</Link> para comentar y dar Me gusta.
            </p>}
            {session === 'error' && <p role="alert">No se pudo comprobar tu sesión. <button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></p>}
            {session === 'ready' && <CommentEditor disabled={Boolean(busy)} onSave={text => saveComment(text)} />}
            <div className="logs-community__feedback">
                {error && <p role="alert">{error}</p>}
                <p role="status">{notice}</p>
            </div>
            {community.comments.length === 0 && <p className="logs-community__empty">Todavía no hay comentarios.</p>}
            <ul className="logs-comments">
                {community.comments.map(comment => {
                    const own = session === 'ready' && viewer?.ID_Usuario === comment.ID_Usuario
                    const canDelete = session === 'ready' && (own || viewer?.Rol?.toLowerCase() === 'administrador')
                    return <li className="logs-comment" key={comment.ID_Comentario}>
                        <div className="logs-comment__author">
                            <Avatar usuario={comment.Autor} />
                            <div><strong>{comment.Autor.Usuario}</strong>
                                <time dateTime={comment.Fecha}>{dateFormat.format(new Date(comment.Fecha))}{comment.Editado ? ' · Editado' : ''}</time>
                            </div>
                        </div>
                        {editing === comment.ID_Comentario && own ? <CommentEditor key={comment.ID_Comentario}
                            initialText={comment.Texto} editing disabled={Boolean(busy)}
                            onSave={text => saveComment(text, comment.ID_Comentario)} onCancel={() => setEditing(null)} />
                            : <p className="logs-comment__text">{comment.Texto}</p>}
                        {(own || canDelete) && <div className="logs-comment__actions">
                            {own && editing !== comment.ID_Comentario && <button type="button" disabled={Boolean(busy)}
                                onClick={() => { setEditing(comment.ID_Comentario); setDeleting(null) }}>Editar</button>}
                            {canDelete && <button type="button" disabled={Boolean(busy)} onClick={() => setDeleting(comment.ID_Comentario)}>Eliminar</button>}
                        </div>}
                        {deleting === comment.ID_Comentario && canDelete && <div className="logs-comment__confirm" role="group" aria-label="Confirmar eliminación">
                            <p>¿Eliminar este comentario?</p>
                            <button type="button" disabled={Boolean(busy)} onClick={() => deleteComment(comment.ID_Comentario)}>Sí, eliminar</button>
                            <button type="button" disabled={Boolean(busy)} onClick={() => setDeleting(null)}>Cancelar</button>
                        </div>}
                    </li>
                })}
            </ul>
            {community.nextCursor && <button type="button" className="logs-comments__more" disabled={Boolean(busy)} onClick={loadMore}>
                {busy === 'more' ? 'Cargando…' : 'Ver más comentarios'}
            </button>}
        </>}
    </section>
}
