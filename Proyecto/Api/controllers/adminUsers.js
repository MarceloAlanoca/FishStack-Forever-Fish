const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const User = require("../models/userModel");
const { removeProfilePhoto } = require("../middlewares/profilePhoto");

const publicAttributes = { exclude: ["Contraseña"] };

function validateUser(body, creating) {
    const fields = ["Nombre", "Apellido", "Correo", "Usuario"];
    for (let i = 0; i < fields.length; i++) {
        const value = body[fields[i]];
        if (typeof value !== "string" || !value.trim() || value.trim().length > 255) {
            return "Completa nombre, apellido, correo y usuario (hasta 255 caracteres).";
        }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.Correo.trim())) {
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
    if (creating || (password !== undefined && password !== "")) {
        if (typeof password !== "string" || password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
            return "La contraseña debe tener al menos 6 caracteres y como máximo 72 bytes.";
        }
    }
    return "";
}

function sendError(res, error) {
    if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "El usuario o correo ya está registrado." });
    }
    if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ message: "No se puede eliminar esta cuenta porque tiene registros relacionados." });
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

    if (!creating && Number(req.params.id) === req.user.id && body.Rol !== "Administrador") {
        return res.status(400).json({ message: "No puedes quitarte tu propio rol de administrador." });
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
        const where = { [Op.or]: [{ Usuario: data.Usuario }, { Correo: data.Correo }] };
        if (!creating) where.ID_Usuario = { [Op.ne]: req.params.id };
        if (await User.findOne({ where })) {
            return res.status(409).json({ message: "El usuario o correo ya está registrado." });
        }

        if (body.Contraseña) data.Contraseña = await bcrypt.hash(body.Contraseña, 12);
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
        await user.destroy();
        await removeProfilePhoto(user.Foto_Perfil);
        res.json({ message: "Usuario eliminado." });
    } catch (error) {
        sendError(res, error);
    }
}

module.exports = { listUsers, selectUser, saveUser, deleteUser };
