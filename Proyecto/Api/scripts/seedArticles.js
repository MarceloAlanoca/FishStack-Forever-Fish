const { Article } = require("../models/articlesModel");
const { sequelize } = require("../config/db");

async function seedArticles() {
    // Carga el catalogo cuando la tabla esta vacia.
    if (await Article.count() > 0) return;

    await sequelize.transaction(async (transaction) => {
        const emptyCatalog = await Article.count({ transaction }) === 0;
        for (let i = 1; emptyCatalog && i <= 5; i++) {
            const doblones = i * 200;
            await Article.findOrCreate({
                where: { Nombre: doblones + " doblones" },
                defaults: {
                    Descripcion: "Paquete de " + doblones + " doblones para FishStack: Forever Fish.",
                    Precio: i * 5000,
                    Doblones: doblones,
                    Tipo: "Doblones"
                },
                transaction
            });
        }
    });
}

module.exports = { seedArticles };
