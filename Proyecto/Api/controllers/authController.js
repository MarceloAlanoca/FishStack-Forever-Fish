const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validText, validEmail, validPassword } = require("../validations");

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
        } = req.body || {};

        if (!validText(Nombre) || !validText(Apellido) || !validText(Usuario) || !validPassword(Contraseña, 6)) {
            return res.status(400).json({
                message: "Completa nombre, apellido y usuario. La contraseña debe tener al menos 6 caracteres y hasta 72 bytes."
            });
        }

        if (!validEmail(Correo)) {
            return res.status(400).json({
                message: "El correo electrónico no es válido"
            });
        }

        const correoNormalizado = Correo.trim().toLowerCase();

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
        // Sequelize verifica las columnas unique al guardar.
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ message: "El usuario o correo ya esta registrado." });
        }
        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({ message: "Revisa los datos ingresados." });
        }
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
        } = req.body || {};

        if (!validText(Usuario) || !validPassword(Contraseña, 1)) {
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
        if (!user || !user.isActive || !await bcrypt.compare(Contraseña, user.Contraseña)) {
            return res.status(400).json({
                message: "Credenciales incorrectas"
            });
        }

        const payload = {
            version: user.authVersion,
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
