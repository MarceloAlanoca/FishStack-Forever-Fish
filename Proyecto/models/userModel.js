const { sequelize } = require('../config/db.js');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
    ID_Usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Nombre_Vista: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Contraseña: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Rol: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
}, {
    tableName: 'usuarios',
    timestamps: true
});

module.exports = { User };