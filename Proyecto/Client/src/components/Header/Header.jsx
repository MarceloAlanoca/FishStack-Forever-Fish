import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import useCurrentUser from "../../hooks/useCurrentUser"
import Avatar from "../Avatar/Avatar"
import LogoutModal from "./LogoutModal"

import "./Header.css"

function Header({ usuario: suppliedUser, theme = "ocean" }) {
    const location = useLocation()
    const navigate = useNavigate()
    const { usuario: loadedUser } = useCurrentUser(suppliedUser === undefined)
    const usuario = suppliedUser === undefined ? loadedUser : suppliedUser
    const [confirmarSalida, setConfirmarSalida] = useState(false)
    const sesionActiva = Boolean(localStorage.getItem("token"))

    const cerrarSesion = () => {
        localStorage.removeItem("token")
        setConfirmarSalida(false)
        navigate("/login", { replace: true })
    }

    const enlaceActivo = (ruta) => {
        return location.pathname === ruta ? "site-header__active" : ""
    }

    return (
        <header className={`site-header${theme === "slate" ? " site-header--slate" : ""}`}>
            {sesionActiva && (
                <button className="site-header__logout" type="button" onClick={() => setConfirmarSalida(true)}>
                    Cerrar sesión
                </button>
            )}
            <Link className="site-header__brand" to="/home" aria-label="Ir al inicio">
                <img src="/images/FishStackFFLogo.png" alt="" />
                <span>
                    <strong>FishStack</strong>
                    <small>Forever Fish</small>
                </span>
            </Link>

            <div className="site-header__right">
            <nav className="site-header__nav" aria-label="Navegacion principal">
                {sesionActiva && usuario?.Rol?.toLowerCase() === "administrador" && (
                    <Link className={`site-header__admin ${enlaceActivo("/crud")}`} to="/crud">Admin</Link>
                )}
                <Link className={enlaceActivo("/home")} to="/home">Home</Link>
                <Link className={enlaceActivo("/game")} to="/game">Jugar</Link>
                <Link className={enlaceActivo("/credits")} to="/credits">Creditos</Link>
            </nav>
            {sesionActiva && (
                <Link className="site-header__profile" to="/profile" aria-label={usuario ? `Ver perfil de ${usuario.Usuario}` : "Ver mi perfil"}>
                    <span>{usuario?.Usuario || "Mi perfil"}</span>
                    <Avatar usuario={usuario} />
                </Link>
            )}
            </div>
            {confirmarSalida && <LogoutModal usuario={usuario}
                onCancel={() => setConfirmarSalida(false)} onConfirm={cerrarSesion} />}
        </header>
    )
}

export default Header
