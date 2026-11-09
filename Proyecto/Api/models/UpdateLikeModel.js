const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./userModel');
const { Updates } = require('./UpdateModel');

// La clave compuesta impide que una cuenta tenga dos Me gusta en la misma publicación.
const UpdateLike = sequelize.define('UpdateLike', {
    ID_Update: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: Updates, key: 'ID_Update' },
        onDelete: 'CASCADE'
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: User, key: 'ID_Usuario' },
        onDelete: 'CASCADE'
    }
}, { tableName: 'updateslikes', timestamps: false });

module.exports = { UpdateLike };
