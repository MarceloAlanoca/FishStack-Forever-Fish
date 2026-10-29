import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <section className="site-footer__brand">
          <h2>🎣 FishStack: Forever Fish</h2>
          <p>Explorá un mundo de pesca, aventuras y descubrimientos. Un proyecto de DevPlay Studio.</p>
        </section>

        <nav className="site-footer__links" aria-label="Navegación del pie de página">
          <h3>Explorar</h3>
          <Link to="/">Inicio</Link>
          <Link to="/home">Home</Link>
          <Link to="/game">Jugar</Link>
          <Link to="/shop">Tienda</Link>
          <Link to="/logs">Actualizaciones</Link>
          <Link to="/credits">Créditos</Link>
        </nav>

        <section className="site-footer__links">
          <h3>Comunidad</h3>
          <a href="https://youtube.com/@devplaystudio-o7z" target="_blank" rel="noopener noreferrer">YouTube · DevPlay Studio</a>
          <a href="https://github.com/MarceloAlanoca/FishStack-Forever-Fish" target="_blank" rel="noopener noreferrer">GitHub · FishStack</a>
        </section>
      </div>
      <div className="site-footer__bottom">© {new Date().getFullYear()} DevPlay Studio · FishStack: Forever Fish</div>
    </footer>
  );
}

export default Footer;
