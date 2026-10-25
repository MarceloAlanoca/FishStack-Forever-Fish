const { Updates } = require("../models/UpdateModel");

const getUpdates = async (req, res) => {
    try {
        const updates = await Updates.findAll({
            attributes: ["ID_Update", "Nombre", "Version", "Descripcion_Inicial", "Fecha"],
            order: [["Fecha", "DESC"], ["ID_Update", "DESC"]]
        });
        res.json(updates);
    } catch (error) {
        console.error("Error al consultar actualizaciones", error);
        res.status(500).json({ message: "No se pudieron cargar las actualizaciones." });
    }
};

const getUpdatesByID = async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
        return res.status(400).json({ message: "El identificador de actualización no es válido." });
    }
    try {
        const update = await Updates.findByPk(req.params.id);
        if (!update) return res.status(404).json({ message: "Actualización no encontrada." });
        res.json(update);
    } catch (error) {
        console.error("Error al consultar la actualización", error);
        res.status(500).json({ message: "No se pudo cargar esta actualización." });
    }
};

module.exports = { getUpdates, getUpdatesByID };
