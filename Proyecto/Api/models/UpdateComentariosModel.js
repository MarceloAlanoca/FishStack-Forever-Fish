const { sequelize } = require('../config/db.js');
const { DataTypes } = require('sequelize');

const UpdatesComentarios = sequelize.define('UpdatesComentarios', {
    ID_Update: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    Texto: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    Fecha: {
        type: DataTypes.TEXT,
        allowNull: false
    },

}, {
    tableName: 'updatescomentarios',
    timestamps: true
});

module.exports = { updatescomentarios };