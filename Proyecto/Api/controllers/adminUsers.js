const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const { validText, validEmail, validPassword, validAmount } = require("../validations");

const publicAttributes = { exclude: ["Contraseña"] };

function validateUser(body, creating) {
    if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
        return "El estado debe ser activo o inactivo.";
    }
    if (body.Doblones !== undefined && !validAmount(body.Doblones)) {
        return "Los doblones deben ser un entero entre 0 y 2.147.483.647.";
    }
    const fields = ["Nombre", "Apellido", "Correo", "Usuario"];
    for (let i = 0; i < fields.length; i++) {
        const value = body[fields[i]];
        if (!validText(value)) {
            return "Completa nombre, apellido, correo y usuario (hasta 255 caracteres).";
        }
    }
    if (!validEmail(body.Correo)) {
        return "Ingresa un correo válido.";
    }
    if (body.Usuario.trim().length < 3) {
        return "El usuario debe tener al menos 3 caracteres.";
    }
    if (body.Rol !== "Usuario" && body.Rol !== "Administrador") {
        return "Selecciona un rol válido.";
    }
    // En edición, dejar la contraseña vacía conserva la que ya tiene la cuenta.
    const password = body.Contraseña;
    if ((creating || (password !== undefined && password !== "")) && !validPassword(password, 6)) {
        return "La contraseña debe tener al menos 6 caracteres y como máximo 72 bytes.";
    }
    return "";
}

function sendError(res, error) {
    if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "El usuario o correo ya está registrado." });
    }
    if (error.name === "SequelizeValidationError") {
        return res.status(400).json({ message: "Revisa los datos ingresados." });
    }
    console.error("Error en la administración de usuarios", error);
    return res.status(500).json({ message: "No se pudo completar la operación. Intenta nuevamente." });
}

async function listUsers(req, res) {
    try {
        const users = await User.findAll({ attributes: publicAttributes, order: [["ID_Usuario", "ASC"]] });
        res.json(users);
    } catch (error) {
        sendError(res, error);
    }
}

async function selectUser(req, res) {
    try {
        const user = await User.findByPk(req.params.id, { attributes: publicAttributes });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
        res.json(user);
    } catch (error) {
        sendError(res, error);
    }
}

async function saveUser(req, res) {
    const creating = !req.params.id;
    const body = req.body || {};
    const message = validateUser(body, creating);
    if (message) return res.status(400).json({ message });

    if (!creating && Number(req.params.id) === req.user.id && (body.Rol !== "Administrador" || body.isActive === false)) {
        return res.status(400).json({ message: "No puedes desactivar tu cuenta ni quitarte tu rol desde el panel." });
    }

    try {
        let user;
        if (!creating) {
            user = await User.findByPk(req.params.id);
            if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const data = {
            Nombre: body.Nombre.trim(),
            Apellido: body.Apellido.trim(),
            Correo: body.Correo.trim().toLowerCase(),
            Usuario: body.Usuario.trim(),
            Rol: body.Rol
        };
        if (body.Doblones !== undefined) data.Doblones = body.Doblones;
        if (body.isActive !== undefined) data.isActive = body.isActive;
        // Las columnas unique y sendError se encargan de los usuarios o correos repetidos.

        if (body.Contraseña) {
            data.Contraseña = await bcrypt.hash(body.Contraseña, 12);
            data.resetTokenHash = null;
            data.resetExpiresAt = null;
        }
        if (body.isActive === false) {
            data.resetTokenHash = null;
            data.resetExpiresAt = null;
            if (!creating) data.authVersion = User.sequelize.literal("authVersion + 1");
        }
        if (creating) {
            user = await User.create(data);
        } else {
            await user.update(data);
        }
        const publicUser = await User.findByPk(user.ID_Usuario, { attributes: publicAttributes });
        res.status(creating ? 201 : 200).json(publicUser);
    } catch (error) {
        sendError(res, error);
    }
}

async function deleteUser(req, res) {
    if (Number(req.params.id) === req.user.id) {
        return res.status(400).json({ message: "No puedes eliminar la cuenta con la que estás administrando." });
    }
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
        await user.update({ isActive: false, resetTokenHash: null, resetExpiresAt: null,
            authVersion: User.sequelize.literal("authVersion + 1") });
        res.json({ message: "Cuenta desactivada." });
    } catch (error) {
        sendError(res, error);
    }
}

module.exports = { listUsers, selectUser, saveUser, deleteUser };
