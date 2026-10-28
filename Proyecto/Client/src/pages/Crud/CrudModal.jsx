import { useEffect, useRef } from "react"

export default function CrudModal({ title, busy, error, onClose, children }) {
    const dialog = useRef(null)

    useEffect(() => {
        const element = dialog.current
        element.showModal()
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            element.close()
            document.body.style.overflow = previousOverflow
        }
    }, [])

    function closeModal() {
        if (!busy) onClose()
    }

    return (
        <dialog
            ref={dialog}
            className="crud-modal"
            aria-labelledby="crud-modal-title"
            aria-busy={busy}
            onCancel={(event) => event.preventDefault()}
        >
            <div className="crud-modal-header">
                <h3 id="crud-modal-title">{title}</h3>
                <button type="button" onClick={closeModal} disabled={busy} aria-label="Cerrar formulario">
                    ×
                </button>
            </div>
            <div className="crud-modal-body">
                {error && <p className="crud-feedback crud-feedback--error" role="alert">{error}</p>}
                {children}
            </div>
        </dialog>
    )
}
