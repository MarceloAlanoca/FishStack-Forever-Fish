const User = require("../models/userModel");

// Usa la cuenta admin1 existente y conserva su contraseña y demás datos.
const ensureAdminAccount = async () => {
    const existing = await User.findOne({ where: { Usuario: "admin1" } });
    if (existing) {
        if (existing.Nombre !== "admin" || existing.Rol !== "Administrador") {
            await existing.update({ Nombre: "admin", Rol: "Administrador" });
        }
        return;
    }

    await User.create({
        Nombre: "admin",
        Apellido: "FishStack",
        Correo: "admin1@fishstack.example",
        Usuario: "admin1",
        Contraseña: "$2b$12$tu76hoUXn8D9llnmETa8Y.96FMWeObVmj28XaIEBGg.nxmbnglIia",
        Rol: "Administrador"
    });
    console.log("Cuenta admin1 preparada con rol Administrador.");
};

module.exports = { ensureAdminAccount };
