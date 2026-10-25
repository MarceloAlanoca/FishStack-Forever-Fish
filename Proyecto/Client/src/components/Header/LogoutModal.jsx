import { useEffect, useRef } from "react"

export default function LogoutModal({ usuario, onCancel, onConfirm }) {
    const dialogRef = useRef(null)

    useEffect(() => {
        const dialog = dialogRef.current
        dialog.showModal()
        return () => dialog.close()
    }, [])

    return (
        <dialog ref={dialogRef} className="logout-modal" aria-labelledby="logout-title" aria-describedby="logout-description"
            onCancel={(event) => { event.preventDefault(); onCancel() }}>
            <h2 id="logout-title">¿Cerrar sesión?</h2>
            <p id="logout-description">
                {usuario?.Usuario ? `¿Quieres cerrar la sesión de ${usuario.Usuario}?` : "¿Quieres cerrar la sesión de tu cuenta?"}
            </p>
            <div className="logout-modal__actions">
                <button type="button" autoFocus onClick={onCancel}>Cancelar</button>
                <button className="logout-modal__confirm" type="button" onClick={onConfirm}>Cerrar sesión</button>
            </div>
        </dialog>
    )
}
