const bcrypt = require("bcrypt");
const User = require("../models/userModel");

const updateUsername = async (req, res) => {
    const name = req.body?.Usuario;

    if (typeof name !== "string" || !name.trim() || name.trim().length > 255) {
        return res.status(400).json({ message: "El nombre debe tener entre 1 y 255 caracteres." });
    }

    try {
        const user = req.account;
        await user.update({ Usuario: name.trim() });
        res.json(await User.findByPk(req.user.id, { attributes: { exclude: ["Contraseña"] } }));
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ message: "Ese usuario ya está en uso." });
        }
        res.status(500).json({ message: "No se pudo cambiar el nombre. Inténtalo de nuevo." });
    }
};

const updatePassword = async (req, res) => {
    const current = req.body?.currentPassword;
    const next = req.body?.newPassword;
    const confirmation = req.body?.confirmPassword;

    // bcrypt admite hasta 72 bytes, una letra con tilde o un emoji puede ocupar mas de uno.
    if (typeof current !== "string" || !current || typeof next !== "string" ||
        next.length < 8 || Buffer.byteLength(next, "utf8") > 72) {
        return res.status(400).json({ message: "Ingresa la contraseña actual y una nueva de al menos 8 caracteres y hasta 72 bytes." });
    }
    if (next !== confirmation) {
        return res.status(400).json({ message: "Las contraseñas nuevas no coinciden." });
    }

    try {
        const user = req.account;
        if (!await bcrypt.compare(current, user.Contraseña)) {
            return res.status(400).json({ message: "La contraseña actual es incorrecta." });
        }

        const hash = await bcrypt.hash(next, 12);
        // actualiza solo si el hash sigue siendo el mismo, para evitar dos cambios simultaneos.
        const [updated] = await User.update({ Contraseña: hash }, {
            where: { ID_Usuario: req.user.id, Contraseña: user.Contraseña }
        });
        // updated indica cuantas filas se modificaron, cero significa que otra solicitud ya la cambio.
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
        const user = req.account;
        await user.update({ Apellido: surname.trim() });
        res.json(await User.findByPk(req.user.id, { attributes: { exclude: ["Contraseña"] } }));
    } catch {
        res.status(500).json({ message: "No se pudo cambiar el apellido. Inténtalo de nuevo." });
    }
};

module.exports = { updateUsername, updatePassword, updateSurname };
