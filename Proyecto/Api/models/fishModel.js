const { sequelize } = require('../config/db.js');
const { DataTypes } = require('sequelize');

const Fish = sequelize.define('Fish', {
    ID_Pez: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre_pez: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Peso: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Precio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Calidad: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
}, {
    tableName: 'peces',
    timestamps: true
});

module.exports = { Fish };