const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const User = require('../userModel');

const GameSave = sequelize.define('GameSave', {
    userId: { type: DataTypes.INTEGER, primaryKey: true, references: { model: User, key: 'ID_Usuario' } },
    schemaVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    state: {
        type: DataTypes.JSON, allowNull: false,
        get() {
            const value = this.getDataValue('state');
            return typeof value === 'string' ? JSON.parse(value) : value;
        }
    },
    lastRequestId: { type: DataTypes.UUID, allowNull: true },
    lastRequestHash: { type: DataTypes.STRING(64), allowNull: true }
}, { tableName: 'partidas', timestamps: true });

module.exports = { GameSave };
