import "./Principal.css";

function Principal() {
  const moverLogo = (event) => {
    const imagen = event.currentTarget
    const rect = imagen.getBoundingClientRect()

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const centroX = rect.width / 2
    const centroY = rect.height / 2

    const intensidad = 25

    const rotX =
      ((y - centroY) / centroY) * -intensidad

    const rotY =
      ((x - centroX) / centroX) * intensidad

    imagen.style.transform = `
            rotateX(${rotX}deg)
            rotateY(${rotY}deg)
            scale(1.05)
        `
  }

  const resetearLogo = (event) => {
    event.currentTarget.style.transform = `
            rotateX(0deg)
            rotateY(0deg)
            scale(1)
        `
  }

  const subirPagina = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  // el front end :v
  return (
    <main className="principal-page">
      <video id="bgVideo" autoPlay loop muted playsInline>
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_202655_a7f5aca0-2f80-4bc9-bcb5-96ac95662003.mp4"
          type="video/mp4"
        />
      </video>

      <section className="intro hero-section">
        <div className="hero-content">
          <div className="logo-container">
            <img
              src="/images/FishStackFFLogo.png"
              id="logo"
              alt="FishStack Logo"
              onMouseMove={moverLogo}
              onMouseLeave={resetearLogo}
            />
          </div>

          <h1 className="title">FishStack:</h1>

          <h2 className="subtitle">Forever Fish</h2>

          <a href="/login" className="enter-btn">
            Entrar al Mundo
          </a>
        </div>
      </section>
      <section className="info-section">
        <div className="info-box">
          <h2>¿Qué es FishStack: Forever Fish?</h2>

          <p>
            FishStack: Forever Fish es una secuela de FishStack, centrada en la
            pesca, exploración y progresión en un mundo de pixeles 2D.
          </p>

          <div className="modos">
            <div className="modo">
              <h3>Modo Historia</h3>
              <p>
                Avanza, consigue cañas, barcos, amuletos y descubre la historia
                del mundo.
              </p>
            </div>

            <div className="modo">
              <h3>Forever Fish</h3>
              <p>
                Un modo infinito tipo rogue-lite donde la dificultad aumenta
                progresivamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="capturas-section">

        <h2>Capturas del juego</h2>

        <div className="carrusel-wrapper">

          <div className="carrusel">

            <img src="/images/PLACEHOLDER.png" alt="Captura" />
            <img src="/images/PLACEHOLDER-2.png" alt="Captura" />
            <img src="/images/PLACEHOLDER.png" alt="Captura" />

            <img src="/images/PLACEHOLDER.png" alt="Captura" />
            <img src="/images/PLACEHOLDER-2.png" alt="Captura" />
            <img src="/images/PLACEHOLDER.png" alt="Captura" />

          </div>


          <div className="carrusel reverso">

            <img src="/images/PLACEHOLDER-2.png" alt="Captura" />
            <img src="/images/PLACEHOLDER.png" alt="Captura" />
            <img src="/images/PLACEHOLDER-2.png" alt="Captura" />

            <img src="/images/PLACEHOLDER-2.png" alt="Captura" />
            <img src="/images/PLACEHOLDER.png" alt="Captura" />
            <img src="/images/PLACEHOLDER-2.png" alt="Captura" />

          </div>

        </div>

      </section>

      <section className="estadisticas-section">
        <h2>FishStack en números</h2>

        <div className="stats-container">
          <div className="stat">
            <h3>Jugadores</h3>
            <p>10.000+</p>
          </div>

          <div className="stat">
            <h3>Valoración</h3>
            <p>4.8 / 5</p>
          </div>

          <div className="stat">
            <h3>Visitas</h3>
            <p>500.000+</p>
          </div>

          <div className="stat">
            <h3>Desarrolladores</h3>
            <p>4</p>
          </div>
        </div>
      </section>

      <section className="ultima-actualizacion">
        <div className="update-box">

          <h2>Ultima Actualizacion</h2>

          <p className="fecha-update">
            22 de Agosto de 2026
          </p>

          <h3>
            v0.0.1 - Desarrollo inicial
          </h3>

          <p className="detalles-update">
            Estamos trabajando en la primera version de FishStack: Forever Fish.
            Actualmente se encuentra en desarrollo el sistema de pesca,
            los modos Historia y Forever Fish, y la pagina web oficial.
          </p>

          <img
            src="/images/PLACEHOLDER-3.png"
            alt="Ultima actualizacion de FishStack"
          />

        </div>
      </section>

      <button
        id="btnTop"
        onClick={subirPagina}
        aria-label="Volver arriba"
      >
        ↑
      </button>
    </main>
  );
}

export default Principal;
