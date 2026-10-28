const { CreditIntegrante } = require("../models/creditsIntegrantesModel");
const { CreditInspiracion } = require("../models/creditsInspiracionesModel");

async function getCredits(req, res) {
    try {
        const integrantes = await CreditIntegrante.findAll({ order: [["orden", "ASC"], ["id", "ASC"]] });
        const inspiraciones = await CreditInspiracion.findAll({ order: [["orden", "ASC"], ["id", "ASC"]] });
        res.json({ integrantes, inspiraciones });
    } catch (error) {
        console.error("Error al obtener creditos", error);
        res.status(500).json({ message: "No se pudieron cargar los creditos." });
    }
}

module.exports = { getCredits };
