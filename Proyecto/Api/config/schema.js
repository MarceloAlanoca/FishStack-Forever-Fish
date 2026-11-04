const { DataTypes } = require("sequelize");
const { sequelize } = require("./db");

// Migración aditiva para bases creadas con el SQL original.
async function ensureSchema() {
    const query = sequelize.getQueryInterface();
    const columns = await query.describeTable("usuarios");
    if (!columns.Foto_Perfil) {
        await query.addColumn("usuarios", "Foto_Perfil", {
            type: DataTypes.STRING(255), allowNull: true
        });
    }
    const indexes = await query.showIndex("usuarios");
    if (!indexes.some(index => index.unique && index.fields.length === 1 && index.fields[0].attribute === "Usuario")) {
        await query.addIndex("usuarios", ["Usuario"], { unique: true, name: "uq_usuarios_usuario" });
    }
}

module.exports = { ensureSchema };
