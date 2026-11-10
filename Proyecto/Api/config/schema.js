const { DataTypes } = require("sequelize");
const { sequelize } = require("./db");

// Migración aditiva para bases creadas con el SQL original.
async function ensureCommentsSchema() {
    const query = sequelize.getQueryInterface();
    if (!await query.tableExists('updatescomentarios')) return;
    const comments = await query.describeTable("updatescomentarios");
    if (!comments.ID_Comentario) {
        // El modelo anterior usaba (publicación, usuario) como clave primaria.
        // Agrega un ID por comentario sin borrar las filas que ya existan.
        await sequelize.query(`ALTER TABLE updatescomentarios
            DROP PRIMARY KEY,
            ADD COLUMN ID_Comentario INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST`);
    }
    if (!comments.Editado) {
        await query.addColumn('updatescomentarios', 'Editado', {
            type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
        });
    }
}

async function ensureSchema() {
    const query = sequelize.getQueryInterface();
    const columns = await query.describeTable("usuarios");
    if (!columns.walletRevision) {
        await query.addColumn('usuarios', 'walletRevision', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
    }
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

module.exports = { ensureSchema, ensureCommentsSchema };
