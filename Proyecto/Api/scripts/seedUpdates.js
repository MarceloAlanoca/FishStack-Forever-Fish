const { Updates } = require("../models/UpdateModel");
const { sequelize } = require("../config/db");

// Carga la actualizacion de ejemplo cuando la tabla esta vacia.
async function seedUpdates() {
    if (await Updates.count() > 0) return;

    await sequelize.transaction(async (transaction) => {
        if (await Updates.count({ transaction }) === 0) {
            await Updates.create({
                Nombre: "Bienvenidos a las actualizaciones de FishStack",
                Version: "0.1.0",
                Descripcion_Inicial: "Estrenamos el registro de novedades de FishStack: Forever Fish. Esta es una publicación de ejemplo.",
                Detalle: "¡Bienvenidos al registro de actualizaciones de FishStack: Forever Fish!\n\nEn esta página vamos a compartir las novedades del juego y de la web: nuevas funciones, mejoras y correcciones.\n\nEsta primera publicación es un ejemplo para presentar el formato. Podés abrir cada tarjeta para leer el detalle completo.\n\n¡Gracias por acompañarnos en esta aventura!\nDevPlay Studio",
                Fecha: new Date("2026-10-25T12:00:00-03:00")
            }, { transaction });
        }
    });
}

module.exports = { seedUpdates };
