import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const initialForm = {
    Nombre: "",
    Apellido: "",
    Correo: "",
    Nombre_Vista: "",
    Contraseña: ""
};

function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mostrarContraseña, setMostrarContraseña] = useState(false);

    const cambiarDato = ({ target: { name, value } }) => {
        setForm((datosActuales) => ({ ...datosActuales, [name]: value }));
        if (mensaje) setMensaje("");
    };

    const registrar = async (event) => {
        event.preventDefault();
        setCargando(true);
        setMensaje("");

        try {
            const respuesta = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await respuesta.json();

            if (!respuesta.ok) {
                setMensaje(data.message || "No se pudo crear la cuenta");
                return;
            }

            setMensaje("¡Cuenta creada! Redirigiendo...");
            window.setTimeout(() => navigate("/login"), 700);
        } catch (error) {
            console.error(error);
            setMensaje("No se pudo conectar con el servidor");
        } finally {
            setCargando(false);
        }
    };

    return (
        <main className="register-page">
            <div className="register-page__background" aria-hidden="true" />
            <div className="register-page__glow" aria-hidden="true" />

            <button
                className="register-page__back"
                type="button"
                onClick={() => navigate("/")}
            >
                ← Volver a la página principal
            </button>

            <div className="register-bubbles" aria-hidden="true">
                {[12, 24, 43, 67, 81, 92].map((position, index) => (
                    <span key={position} style={{
                        "--bubble-left": `${position}%`,
                        "--bubble-delay": `${index * -1.35}s`,
                        "--bubble-size": `${5 + (index % 3) * 3}px`
                    }} />
                ))}
            </div>

            <section className="register-card" aria-labelledby="register-title">
                <div className="register-card__header">
                    <span className="register-card__kicker">ÚNETE A LA TRIPULACIÓN</span>
                    <h2 id="register-title">Crear cuenta</h2>
                    <p>Completa tus datos para comenzar.</p>
                </div>

                <form className="register-form" onSubmit={registrar}>
                    <div className="register-form__row">
                        <label><span>Nombre</span><input type="text" name="Nombre" placeholder="Tu nombre" value={form.Nombre} onChange={cambiarDato} autoComplete="given-name" required /></label>
                        <label><span>Apellido</span><input type="text" name="Apellido" placeholder="Tu apellido" value={form.Apellido} onChange={cambiarDato} autoComplete="family-name" required /></label>
                    </div>
                    <label>
                        <span>Correo electrónico</span>
                        <input
                            type="email"
                            name="Correo"
                            placeholder="nombre@ejemplo.com"
                            value={form.Correo}
                            onChange={cambiarDato}
                            autoComplete="email"
                            required
                        />
                    </label>
                    <label><span>Nombre de usuario</span><input type="text" name="Nombre_Vista" placeholder="Elige un nombre de usuario" value={form.Nombre_Vista} onChange={cambiarDato} autoComplete="username" minLength="3" required /></label>
                    <label>
                        <span>Contraseña</span>
                        <div className="register-form__password">
                            <input type={mostrarContraseña ? "text" : "password"} name="Contraseña" placeholder="Mínimo 6 caracteres" value={form.Contraseña} onChange={cambiarDato} autoComplete="new-password" minLength="6" required />
                            <button type="button" onClick={() => setMostrarContraseña((valor) => !valor)} aria-label={mostrarContraseña ? "Ocultar contraseña" : "Mostrar contraseña"}>{mostrarContraseña ? "Ocultar" : "Ver"}</button>
                        </div>
                    </label>
                    {mensaje && <p className="register-form__message" role="status">{mensaje}</p>}
                    <button className="register-form__submit" type="submit" disabled={cargando}>{cargando ? "Creando cuenta..." : "Crear mi cuenta"}</button>
                </form>

                <p className="register-card__login">¿Ya tienes una cuenta?{" "}<button type="button" onClick={() => navigate("/login")}>Inicia sesión</button></p>
            </section>

            <section className="register-intro" aria-label="Bienvenida">
                <span className="register-intro__eyebrow">FISHSTACK</span>
                <h1>
                    Una nueva aventura
                    <br />
                    comienza aquí.
                </h1>
                <p>Crea tu perfil y sumérgete en nuestro mundo.</p>
            </section>
        </main>
    );
}

export default Register;
