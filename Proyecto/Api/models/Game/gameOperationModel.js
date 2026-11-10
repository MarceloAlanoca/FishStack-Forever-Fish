const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const User = require('../userModel');

const GameOperation = sequelize.define('GameOperation', {
    userId: { type: DataTypes.INTEGER, primaryKey: true, references: { model: User, key: 'ID_Usuario' } },
    requestId: { type: DataTypes.UUID, primaryKey: true },
    requestHash: { type: DataTypes.STRING(64), allowNull: false },
    result: { type: DataTypes.JSON, allowNull: false,
        get() { const value = this.getDataValue('result'); return typeof value === 'string' ? JSON.parse(value) : value; } }
}, { tableName: 'operaciones_juego', timestamps: true, updatedAt: false });

module.exports = { GameOperation };
