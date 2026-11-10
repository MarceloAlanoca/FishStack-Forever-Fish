const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const User = require('../userModel');

const CoinMovement = sequelize.define('CoinMovement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'ID_Usuario' } },
    actorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: User, key: 'ID_Usuario' } },
    kind: { type: DataTypes.STRING(30), allowNull: false },
    reason: { type: DataTypes.STRING(240), allowNull: false },
    operationKey: { type: DataTypes.STRING(100), allowNull: false },
    delta: { type: DataTypes.INTEGER, allowNull: false },
    balanceBefore: { type: DataTypes.INTEGER, allowNull: false },
    balanceAfter: { type: DataTypes.INTEGER, allowNull: false },
    revisionBefore: { type: DataTypes.INTEGER, allowNull: false },
    revisionAfter: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'movimientos_doblones', timestamps: true, updatedAt: false,
    indexes: [{ unique: true, fields: ['userId', 'operationKey'], name: 'uq_movimiento_operacion' }, { fields: ['userId', 'id'] }]
});

module.exports = { CoinMovement };
