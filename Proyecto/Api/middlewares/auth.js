const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const SECRET = process.env.JWT_SECRET || "losOG";

const isAuth = async (req, res, next) => {
    try {

        const authHeader = req.headers["authorization"];

        // la cabecera contiene bearer y luego el token, toma la segunda parte.
        const token =
            authHeader &&
            authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Acceso denegado. Token no provisto."
            });
        }

        // comprueba la firma y el vencimiento del token, antes de usar el id que contiene.
        const decoded = jwt.verify(token, SECRET);

        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        // conserva la cuenta ya verificada, para no buscarla y comprobarla otra vez en cada endpoint.
        req.account = user;

        // deja los datos de la sesion disponibles para el controlador que se ejecuta despues de next.
        req.user = {
            id: user.ID_Usuario,
            nombreVista: user.Nombre_Vista,
            rol: user.Rol
        };

        next();

    } catch (error) {

        return res.status(403).json({
            message: "Token invalido o expirado"
        });

    }
};

module.exports = {
    isAuth
};
