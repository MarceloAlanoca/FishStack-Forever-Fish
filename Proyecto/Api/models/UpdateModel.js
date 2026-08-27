const { sequelize } = require('../config/db.js');
const { DataTypes } = require('sequelize');

const Updates = sequelize.define('Updates', {
    ID_Update: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Version: {
        type: DataTypes.STRING(40),
        allowNull: false
    },
    Descripcion_Inicial: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    Detalle: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    Fecha: {
        type: DataTypes.DATETIME,
        allowNull: false
    },
}, {
    tableName: 'updates',
    timestamps: true
});

module.exports = { update };