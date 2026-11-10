const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const User = require('../userModel');

const FishCapture = sequelize.define('FishCapture', {
    captureId: { type: DataTypes.UUID, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'ID_Usuario' } },
    speciesId: { type: DataTypes.STRING(100), allowNull: false },
    fingerprint: { type: DataTypes.STRING(64), allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    soldAt: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'capturas_juego', timestamps: true, updatedAt: false, indexes: [{ fields: ['userId'] }] });

module.exports = { FishCapture };
