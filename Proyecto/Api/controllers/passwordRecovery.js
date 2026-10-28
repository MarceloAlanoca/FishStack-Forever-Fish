const { randomBytes, createHash } = require("node:crypto");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const User = require("../models/userModel");
const mail = require("../services/recoveryMail");
const { validEmail, validPassword, validToken } = require("../validations");

const genericMessage = "Si el correo pertenece a una cuenta activa, recibiras un enlace para cambiar tu contraseña. Revisa tambien la carpeta de spam.";
const tokenHash = (token) => createHash("sha256").update(token).digest("hex");

async function requestPasswordReset(req, res) {
    const email = req.body?.Correo;
    if (!validEmail(email)) {
        return res.status(400).json({ message: "Ingresa un correo valido." });
    }
    if (!mail.mailConfigured()) {
        return res.status(503).json({ message: "El correo de recuperacion no esta disponible. Intenta mas tarde." });
    }
    try {
        const user = await User.findOne({ where: { Correo: email.trim().toLowerCase(), isActive: true },
            attributes: ["ID_Usuario", "Correo", "resetExpiresAt"] });
        if (user) {
            // Evita reenviar al mismo correo durante un minuto, incluso desde otra IP.
            const previous = user.resetExpiresAt ? new Date(user.resetExpiresAt).getTime() : 0;
            if (previous > Date.now() + 14 * 60 * 1000) return res.json({ message: genericMessage });
            const token = randomBytes(32).toString("hex");
            const hash = tokenHash(token);
            await user.update({ resetTokenHash: hash, resetExpiresAt: new Date(Date.now() + 15 * 60 * 1000) });
            const link = new URL("/login", process.env.CLIENT_ORIGIN || "http://localhost:5173");
            link.searchParams.set("token", token);
            try {
                await mail.sendRecoveryMail(user.Correo, link.toString());
            } catch {
                await User.update({ resetTokenHash: null, resetExpiresAt: null }, {
                    where: { ID_Usuario: user.ID_Usuario, resetTokenHash: hash }
                });
                // No expone el correo, el enlace ni credenciales en los registros.
                console.error("No se pudo enviar un correo de recuperacion. Revisa la configuracion de Gmail.");
            }
        }
        res.json({ message: genericMessage });
    } catch {
        res.status(500).json({ message: "No se pudo procesar la solicitud. Intenta nuevamente." });
    }
}

async function resetPassword(req, res) {
    const { token, newPassword, confirmPassword } = req.body || {};
    if (!validToken(token)) {
        return res.status(400).json({ message: "El enlace no es valido o ya vencio. Solicita uno nuevo." });
    }
    if (!validPassword(newPassword) || newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Las contraseñas deben coincidir y tener al menos 8 caracteres y como maximo 72 bytes." });
    }
    try {
        // Una sola actualizacion consume el token; dos solicitudes no pueden reutilizarlo.
        const [updated] = await User.update({
            Contraseña: await bcrypt.hash(newPassword, 12),
            resetTokenHash: null,
            resetExpiresAt: null,
            authVersion: User.sequelize.literal("authVersion + 1")
        }, {
            where: { resetTokenHash: tokenHash(token), resetExpiresAt: { [Op.gt]: new Date() }, isActive: true }
        });
        if (!updated) return res.status(400).json({ message: "El enlace no es valido o ya vencio. Solicita uno nuevo." });
        res.json({ message: "Contraseña actualizada. Ya puedes iniciar sesion." });
    } catch {
        res.status(500).json({ message: "No se pudo cambiar la contraseña. Intenta nuevamente." });
    }
}

module.exports = { requestPasswordReset, resetPassword };
