const { sequelize } = require('../config/db.js');
const { DataTypes } = require('sequelize');

const Article = sequelize.define('Article', {
    ID_Pass: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Precio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    tableName: 'articulos',
    timestamps: true
});

module.exports = { Article };