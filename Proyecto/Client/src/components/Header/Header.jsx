import { Link, useLocation, useNavigate } from "react-router-dom"

import "./Header.css"

function Header() {
    const location = useLocation()
    const navigate = useNavigate()

    const cerrarSesion = () => {
        localStorage.removeItem("token")
        navigate("/login")
    }

    const enlaceActivo = (ruta) => {
        return location.pathname === ruta ? "site-header__active" : ""
    }

    return (
        <header className="site-header">
            <Link className="site-header__brand" to="/home" aria-label="Ir al inicio">
                <img src="/images/FishStackFFLogo.png" alt="" />
                <span>
                    <strong>FishStack</strong>
                    <small>Forever Fish</small>
                </span>
            </Link>

            <nav className="site-header__nav" aria-label="Navegacion principal">
                <Link className={enlaceActivo("/home")} to="/home">Home</Link>
                <Link className={enlaceActivo("/game")} to="/game">Jugar</Link>
                <Link className={enlaceActivo("/credits")} to="/credits">Creditos</Link>
                <button type="button" onClick={cerrarSesion}>Salir</button>
            </nav>
        </header>
    )
}

export default Header
