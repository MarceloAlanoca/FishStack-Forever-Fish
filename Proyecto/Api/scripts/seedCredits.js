const { CreditIntegrante } = require("../models/creditsIntegrantesModel");
const { CreditInspiracion } = require("../models/creditsInspiracionesModel");
const { integrantes, inspiraciones } = require("./creditsData.json");

const marcelo = integrantes.find(({ nombre }) => nombre === "Marcelo");
const textosAnterioresDeMarcelo = {
    descripcion: "Trabajó en cosas agregadas dentro del juego y cosas de diseño de la pagina. El scrum master del proyecto",
    detalle: ".",
    aporte: ""
};

async function seedCredits() {
    if (await CreditIntegrante.count() === 0) {
        await CreditIntegrante.bulkCreate(integrantes, { validate: true });
    } else {
        // Completa los textos originales de Marcelo sin pisar cambios hechos desde el panel Admin.
        for (const [campo, anterior] of Object.entries(textosAnterioresDeMarcelo)) {
            await CreditIntegrante.update({ [campo]: marcelo[campo] }, {
                where: { nombre: marcelo.nombre, imagen: marcelo.imagen, [campo]: anterior }
            });
        }
    }
    if (await CreditInspiracion.count() === 0) {
        await CreditInspiracion.bulkCreate(inspiraciones, { validate: true });
    }
}

module.exports = { seedCredits };
