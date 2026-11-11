const { Op } = require("sequelize");
const { Activity } = require("../models/activityModel");

const visibilityMs = 30 * 60 * 1000;

async function getActivity(req, res) {
    try {
        const now = Date.now();
        const entries = await Activity.findAll({
            where: { userId: req.user.id, createdAt: { [Op.gt]: new Date(now - visibilityMs) } },
            attributes: ["id", "message", "createdAt"],
            order: [["createdAt", "DESC"], ["id", "DESC"]]
        });
        res.set("Cache-Control", "no-store").json({
            serverTime: new Date(now),
            entries: entries.map(({ id, message, createdAt }) => ({
                id, message, createdAt, expiresAt: new Date(createdAt.getTime() + visibilityMs)
            }))
        });
    } catch (error) {
        console.error("No se pudo consultar la actividad:", error.name);
        res.status(500).json({ message: "No se pudo cargar tu actividad." });
    }
}

module.exports = { getActivity };
