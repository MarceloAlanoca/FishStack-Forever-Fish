import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [Nombre_Vista, setNombreVista] = useState("");
    const [Contraseña, setContraseña] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mostrarContraseña, setMostrarContraseña] = useState(false);

    const iniciarSesion = async (event) => {
        event.preventDefault();
        setCargando(true);
        setMensaje("");

        try {
            const respuesta = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    Nombre_Vista,
                    Contraseña
                })
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                setMensaje(data.message || "No se pudo iniciar sesión");
                return;
            }

            localStorage.setItem("token", data.token);
            navigate("/home");
        } catch (error) {
            console.error(error);
            setMensaje("No se pudo conectar con el servidor");
        } finally {
            setCargando(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-page__background" aria-hidden="true" />
            <div className="login-page__moon-glow" aria-hidden="true" />

            <button
                className="login-page__back"
                type="button"
                onClick={() => navigate("/")}
            >
                ← Volver a la página principal
            </button>

            <section className="login-intro" aria-label="Bienvenida">
                <span className="login-intro__eyebrow">FISHSTACK</span>
                <h1>
                    La aventura
                    <br />
                    continúa esta noche.
                </h1>
                <p>Inicia sesión y vuelve a navegar con nosotros.</p>
            </section>

            <section className="login-card" aria-labelledby="login-title">
                <header className="login-card__header">
                    <span className="login-card__kicker">BIENVENIDO DE NUEVO</span>
                    <h2 id="login-title">Iniciar sesión</h2>
                    <p>Ingresa tus datos para continuar.</p>
                </header>

                <form className="login-form" onSubmit={iniciarSesion}>
                    <label>
                        <span>Nombre de usuario</span>
                        <input
                            type="text"
                            placeholder="Tu nombre de usuario"
                            value={Nombre_Vista}
                            onChange={(event) => {
                                setNombreVista(event.target.value);
                                if (mensaje) setMensaje("");
                            }}
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label>
                        <span>Contraseña</span>
                        <div className="login-form__password">
                            <input
                                type={mostrarContraseña ? "text" : "password"}
                                placeholder="Tu contraseña"
                                value={Contraseña}
                                onChange={(event) => {
                                    setContraseña(event.target.value);
                                    if (mensaje) setMensaje("");
                                }}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarContraseña((valor) => !valor)}
                                aria-label={mostrarContraseña ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {mostrarContraseña ? "Ocultar" : "Ver"}
                            </button>
                        </div>
                    </label>

                    {mensaje && (
                        <p className="login-form__message" role="status">
                            {mensaje}
                        </p>
                    )}

                    <button
                        className="login-form__submit"
                        type="submit"
                        disabled={cargando}
                    >
                        {cargando ? "Ingresando..." : "Entrar a FishStack"}
                    </button>
                </form>

                <p className="login-card__register">
                    ¿Todavía no tienes una cuenta?{" "}
                    <button type="button" onClick={() => navigate("/register")}>
                        Regístrate
                    </button>
                </p>
            </section>
        </main>
    );
}

export default Login;
