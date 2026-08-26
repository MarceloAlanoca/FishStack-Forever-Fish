import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

function Home() {

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);


    useEffect(() => {

        const verificarUsuario = async () => {

            const token = localStorage.getItem("token");

            try {

                const respuesta = await fetch(
                    `${API_URL}/api/auth/perfil`,
                    {
                        method: "GET",

                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!respuesta.ok) {

                    localStorage.removeItem("token");

                    navigate("/login");

                    return;
                }

                const data = await respuesta.json();

                setUsuario(data.usuario);

            } catch (error) {

                console.log(error);

                localStorage.removeItem("token");

                navigate("/login");

            } finally {

                setCargando(false);

            }
        };


        verificarUsuario();

    }, [navigate]);


    const cerrarSesion = () => {

        localStorage.removeItem("token");

        navigate("/login");

    };


    if (cargando) {
        return <p>Cargando...</p>;
    }


    return (
        <div>

            <h1>Home FishStack</h1>

            {usuario && (
                <p>
                    Bienvenido {usuario.nombreVista}
                </p>
            )}

            <button onClick={cerrarSesion}>
                Cerrar sesion
            </button>

        </div>
    );
}

export default Home;
