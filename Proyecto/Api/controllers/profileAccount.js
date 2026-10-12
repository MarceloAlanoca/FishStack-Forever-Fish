const bcrypt = require("bcrypt");
const User = require("../models/userModel");

const updateUsername = async (req, res) => {
    const name = req.body?.Nombre_Vista;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 255) {
        return res.status(400).json({ message: "El nombre debe tener entre 1 y 255 caracteres." });
    }
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
        await user.update({ Nombre_Vista: name.trim() });
        res.json(await User.findByPk(req.user.id, { attributes: { exclude: ["Contraseña"] } }));
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ message: "Ese nombre de usuario ya está en uso." });
        }
        res.status(500).json({ message: "No se pudo cambiar el nombre. Inténtalo de nuevo." });
    }
};

const updatePassword = async (req, res) => {
    const current = req.body?.currentPassword;
    const next = req.body?.newPassword;
    const confirmation = req.body?.confirmPassword;
    if (typeof current !== "string" || !current) {
        return res.status(400).json({ message: "Ingresa una contraseña actual válida." });
    }
    if (typeof next !== "string" || next.length < 8 || Buffer.byteLength(next, "utf8") > 72) {
        return res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres y un máximo de 72 bytes." });
    }
    if (next !== confirmation) {
        return res.status(400).json({ message: "Las contraseñas nuevas no coinciden." });
    }
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
        if (!await bcrypt.compare(current, user.Contraseña)) {
            return res.status(400).json({ message: "La contraseña actual es incorrecta." });
        }
        if (current === next) {
            return res.status(400).json({ message: "Elige una contraseña diferente de la actual." });
        }
        const hash = await bcrypt.hash(next, 12);
        // Evitar que dos solicitudes simultáneas cambien la misma contraseña anterior.
        const [updated] = await User.update({ Contraseña: hash }, {
            where: { ID_Usuario: req.user.id, Contraseña: user.Contraseña }
        });
        if (!updated) return res.status(409).json({ message: "La contraseña cambió. Vuelve a intentarlo con la contraseña actual." });
        res.json({ message: "Contraseña actualizada." });
    } catch {
        res.status(500).json({ message: "No se pudo cambiar la contraseña. Inténtalo de nuevo." });
    }
};

const updateSurname = async (req, res) => {
    const surname = req.body?.Apellido;
    if (typeof surname !== "string" || !surname.trim() || surname.trim().length > 255) {
        return res.status(400).json({ message: "El apellido debe tener entre 1 y 255 caracteres." });
    }
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
        await user.update({ Apellido: surname.trim() });
        res.json(await User.findByPk(req.user.id, { attributes: { exclude: ["Contraseña"] } }));
    } catch {
        res.status(500).json({ message: "No se pudo cambiar el apellido. Inténtalo de nuevo." });
    }
};

module.exports = { updateUsername, updatePassword, updateSurname };
