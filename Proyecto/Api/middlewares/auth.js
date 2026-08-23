const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const SECRET = "losOG";

const isAuth = async (req, res, next) => {
    try {

        const authHeader = req.headers["authorization"];

        const token =
            authHeader &&
            authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Acceso denegado. Token no provisto."
            });
        }

        const decoded = jwt.verify(token, SECRET);

        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

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