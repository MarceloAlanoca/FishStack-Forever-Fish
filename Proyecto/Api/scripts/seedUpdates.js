const { Updates } = require("../models/UpdateModel");

// Solo carga el ejemplo si todavía no hay publicaciones. No reemplaza contenido.
const seedUpdates = async () => {
    if (await Updates.count() > 0) return;
    await Updates.create({
        Nombre: "Bienvenidos a las actualizaciones de FishStack",
        Version: "0.1.0",
        Descripcion_Inicial: "Estrenamos el registro de novedades de FishStack: Forever Fish. Esta es una publicación de ejemplo.",
        Detalle: "¡Bienvenidos al registro de actualizaciones de FishStack: Forever Fish!\n\nEn esta página vamos a compartir las novedades del juego y de la web: nuevas funciones, mejoras y correcciones.\n\nEsta primera publicación es un ejemplo para presentar el formato. Podés abrir cada tarjeta para leer el detalle completo.\n\n¡Gracias por acompañarnos en esta aventura!\nDevPlay Studio",
        Fecha: new Date("2026-10-25T12:00:00-03:00")
    });
};

module.exports = { seedUpdates };
