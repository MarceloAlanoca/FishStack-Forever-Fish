const { sequelize } = require("../config/db");

// Renombra la columna existente sin borrar cuentas ni copiar contraseñas.
const migrateUsername = async () => {
    const query = sequelize.getQueryInterface();
    const tables = await query.showAllTables();
    if (!tables.includes("usuarios")) return;

    const columns = await query.describeTable("usuarios");
    if (columns.Nombre_Vista && columns.Usuario) {
        throw new Error("usuarios contiene Nombre_Vista y Usuario. Revisa ambas columnas antes de migrar para conservar los datos.");
    }
    if (columns.Nombre_Vista) {
        await query.renameColumn("usuarios", "Nombre_Vista", "Usuario");
    }
};

module.exports = { migrateUsername };
