const { CreditIntegrante } = require("../models/creditsIntegrantesModel");
const { CreditInspiracion } = require("../models/creditsInspiracionesModel");
const { integrantes, inspiraciones } = require("./creditsData.json");

async function seedCredits() {
    if (await CreditIntegrante.count() === 0) {
        await CreditIntegrante.bulkCreate(integrantes, { validate: true });
    }
    if (await CreditInspiracion.count() === 0) {
        await CreditInspiracion.bulkCreate(inspiraciones, { validate: true });
    }
}

module.exports = { seedCredits };
