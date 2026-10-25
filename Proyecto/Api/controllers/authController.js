const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const User = require("../models/userModel");

const SECRET = process.env.JWT_SECRET || "losOG";


const register = async (req, res) => {
    try {

        const {
            Nombre,
            Apellido,
            Correo,
            Usuario,
            Contraseña
        } = req.body;

        if (!Nombre || !Apellido || !Correo || !Usuario || !Contraseña) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const correoNormalizado = Correo.trim().toLowerCase();
        // comprueba la estructura basica del correo, sin espacios y con un dominio despues del arroba.
        const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoCorreo.test(correoNormalizado)) {
            return res.status(400).json({
                message: "El correo electrónico no es válido"
            });
        }

        const usuarioExistente = await User.findOne({
            where: {
                // basta con que coincida el nombre o el correo, para detectar una cuenta duplicada.
                [Op.or]: [
                    { Usuario: Usuario.trim() },
                    { Correo: correoNormalizado }
                ]
            }
        });

        if (usuarioExistente) {
            const campoDuplicado = usuarioExistente.Correo === correoNormalizado
                ? "El correo electrónico ya está registrado"
                : "El usuario ya existe";

            return res.status(400).json({
                message: campoDuplicado
            });
        }

        // guarda un hash de la contrasena, el 12 define el costo del calculo.
        const hashedPassword = await bcrypt.hash(Contraseña, 12);

        const newUser = await User.create({
            Nombre: Nombre,
            Apellido: Apellido,
            Correo: correoNormalizado,
            Usuario: Usuario.trim(),
            Contraseña: hashedPassword,
            Rol: "Usuario"
        });

        res.status(201).json({
            message: "Usuario registrado con exito",
            usuario: {
                id: newUser.ID_Usuario,
                nombre: newUser.Nombre,
                correo: newUser.Correo,
                usuario: newUser.Usuario,
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
            Usuario,
            Contraseña
        } = req.body;

        if (!Usuario || !Contraseña) {
            return res.status(400).json({
                message: "Usuario y contraseña requeridos"
            });
        }

        const user = await User.findOne({
            where: {
                Usuario: Usuario
            }
        });

        // si no existe la cuenta, el segundo lado no se evalua y no intenta leer su contrasena.
        if (!user || !await bcrypt.compare(Contraseña, user.Contraseña)) {
            return res.status(400).json({
                message: "Credenciales incorrectas"
            });
        }

        const payload = {
            id: user.ID_Usuario,
            usuario: user.Usuario,
            rol: user.Rol
        };

        // firma los datos de la sesion, para que la api pueda verificarlos en otras solicitudes.
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
