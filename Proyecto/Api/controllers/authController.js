const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const SECRET = "losOG";


const register = async (req, res) => {
    try {

        const {
            Nombre,
            Apellido,
            Nombre_Vista,
            Contraseña
        } = req.body;

        if (!Nombre || !Apellido || !Nombre_Vista || !Contraseña) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const usuarioExistente = await User.findOne({
            where: {
                Nombre_Vista: Nombre_Vista
            }
        });

        if (usuarioExistente) {
            return res.status(400).json({
                message: "El nombre de usuario ya existe"
            });
        }

        const hashedPassword = await bcrypt.hash(Contraseña, 12);

        const newUser = await User.create({
            Nombre: Nombre,
            Apellido: Apellido,
            Nombre_Vista: Nombre_Vista,
            Contraseña: hashedPassword,
            Rol: "Usuario"
        });

        res.status(201).json({
            message: "Usuario registrado con exito",
            usuario: {
                id: newUser.ID_Usuario,
                nombre: newUser.Nombre,
                nombreVista: newUser.Nombre_Vista,
                rol: newUser.Rol
            }
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error en el servidor",
            error: error.message
        });

    }
};


const login = async (req, res) => {
    try {

        const {
            Nombre_Vista,
            Contraseña
        } = req.body;

        if (!Nombre_Vista || !Contraseña) {
            return res.status(400).json({
                message: "Usuario y contraseña requeridos"
            });
        }

        const user = await User.findOne({
            where: {
                Nombre_Vista: Nombre_Vista
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Credenciales incorrectas"
            });
        }

        const isMatch = await bcrypt.compare(
            Contraseña,
            user.Contraseña
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Credenciales incorrectas"
            });
        }

        const payload = {
            id: user.ID_Usuario,
            nombreVista: user.Nombre_Vista,
            rol: user.Rol
        };

        const token = jwt.sign(
            payload,
            SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Login correcto",
            token: token
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error en el servidor",
            error: error.message
        });

    }
};


module.exports = {
    register,
    login
};