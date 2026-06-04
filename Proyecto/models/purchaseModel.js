const { sequelize } = require('../config/db.js');
const { DataTypes } = require('sequelize');

const Purchase = sequelize.define('Purchase', {
    ID_Usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Pass: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Compra: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Fecha:{
        type: DataTypes.DATE,
        allowNull: false
    },
    Cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

}, {
    tableName: 'compra',
    timestamps: true
});

module.exports = { Purchase };