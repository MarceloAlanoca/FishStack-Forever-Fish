import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    const [Nombre_Vista, setNombreVista] = useState("");
    const [Contraseña, setContraseña] = useState("");

    const [mensaje, setMensaje] = useState("");


    const iniciarSesion = async (event) => {

        event.preventDefault();

        try {

            const respuesta = await fetch(
                "http://localhost:3000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        Nombre_Vista,
                        Contraseña
                    })
                }
            );

            const data = await respuesta.json();

            if (!respuesta.ok) {
                setMensaje(data.message);
                return;
            }

            localStorage.setItem(
                "token",
                data.token
            );

            navigate("/home");

        } catch (error) {

            console.log(error);

            setMensaje("No se pudo conectar con el servidor");
        }
    };


    return (
        <div>

            <h1>Iniciar sesion</h1>

            <form onSubmit={iniciarSesion}>

                <input
                    type="text"
                    placeholder="Nombre de usuario"
                    value={Nombre_Vista}
                    onChange={(event) =>
                        setNombreVista(event.target.value)
                    }
                />

                <input
                    type="password"
                    placeholder="Contraseña"
                    value={Contraseña}
                    onChange={(event) =>
                        setContraseña(event.target.value)
                    }
                />

                <button type="submit">
                    Iniciar sesion
                </button>

            </form>

            <p>{mensaje}</p>

            <button onClick={() => navigate("/register")}>
                Crear cuenta
            </button>

        </div>
    );
}

export default Login;