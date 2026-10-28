const bcrypt = require("bcrypt");
const User = require("../models/userModel");

async function seedAdmin() {
    if (await User.findOne({ where: { Usuario: "admin" } })) return;

    await User.create({
        Nombre: "Administrador",
        Apellido: "FishStack",
        Correo: "admin@fishstack.local",
        Usuario: "admin",
        Contraseña: await bcrypt.hash("admin123", 12),
        Rol: "Administrador"
    });
}

module.exports = { seedAdmin };
