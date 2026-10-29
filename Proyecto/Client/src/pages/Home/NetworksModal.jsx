import { useEffect, useRef } from "react"

export default function NetworksModal({ onClose }) {
    const dialogRef = useRef(null)

    useEffect(() => {
        const dialog = dialogRef.current
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        dialog.showModal()
        return () => {
            dialog.close()
            document.body.style.overflow = previousOverflow
        }
    }, [])

    return (
        <dialog ref={dialogRef} className="home-networks" aria-labelledby="home-networks-title"
            onCancel={(event) => { event.preventDefault(); onClose() }}>
            <button className="home-networks__close" type="button" onClick={onClose} aria-label="Cerrar redes">×</button>
            <h2 id="home-networks-title">Redes de DevPlay Studio</h2>
            <a className="home-networks__card" href="https://youtube.com/@devplaystudio-o7z?si=ABVArhmDdAWP9lIk"
                target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">▶</span>
                <span><strong>YouTube</strong><small>DevPlay Studio · Abrir canal</small></span>
            </a>
            <div className="home-networks__card home-networks__placeholder">
                <span role="img" aria-label="Ojos mirando">👀</span>
                <strong>Instagram</strong>
            </div>
        </dialog>
    )
}
