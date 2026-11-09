const { sequelize } = require('../config/db.js');
const { DataTypes } = require('sequelize');
const User = require('./userModel');
const { Updates } = require('./UpdateModel');

const UpdatesComentarios = sequelize.define('UpdatesComentarios', {
    ID_Comentario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Update: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Updates, key: 'ID_Update' },
        onDelete: 'CASCADE'
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'ID_Usuario' },
        onDelete: 'CASCADE'
    },
    Texto: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    Editado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    Fecha: {
        // Conserva el formato del modelo original; las nuevas fechas usan ISO 8601.
        type: DataTypes.TEXT,
        allowNull: false
    },

}, {
    tableName: 'updatescomentarios',
    timestamps: true,
    indexes: [{ fields: ['ID_Update', 'ID_Comentario'] }]
});

UpdatesComentarios.belongsTo(User, { as: 'Autor', foreignKey: 'ID_Usuario' });

module.exports = { UpdatesComentarios };
