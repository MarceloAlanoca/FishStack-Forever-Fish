import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        Nombre: "",
        Apellido: "",
        Nombre_Vista: "",
        Contraseña: ""
    });

    const [mensaje, setMensaje] = useState("");

    const cambiarDato = (event) => {

        const { name, value } = event.target;

        setForm({
            ...form,
            [name]: value
        });
    };


    const registrar = async (event) => {

        event.preventDefault();

        try {

            const respuesta = await fetch(
                "http://localhost:3000/api/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(form)
                }
            );

            const data = await respuesta.json();

            if (!respuesta.ok) {
                setMensaje(data.message);
                return;
            }

            setMensaje("Usuario registrado correctamente");

            navigate("/login");

        } catch (error) {

            console.log(error);

            setMensaje("No se pudo conectar con el servidor");
        }
    };


    return (
        <div>

            <h1>Crear cuenta</h1>

            <form onSubmit={registrar}>

                <input
                    type="text"
                    name="Nombre"
                    placeholder="Nombre"
                    value={form.Nombre}
                    onChange={cambiarDato}
                />

                <input
                    type="text"
                    name="Apellido"
                    placeholder="Apellido"
                    value={form.Apellido}
                    onChange={cambiarDato}
                />

                <input
                    type="text"
                    name="Nombre_Vista"
                    placeholder="Nombre de usuario"
                    value={form.Nombre_Vista}
                    onChange={cambiarDato}
                />

                <input
                    type="password"
                    name="Contraseña"
                    placeholder="Contraseña"
                    value={form.Contraseña}
                    onChange={cambiarDato}
                />

                <button type="submit">
                    Registrarse
                </button>

            </form>

            <p>{mensaje}</p>

            <button onClick={() => navigate("/login")}>
                Ya tengo una cuenta
            </button>

        </div>
    );
}

export default Register;