const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Separada de las compras reales y sin datos personales ni de tarjeta.
const SimulatedPurchase = sequelize.define("SimulatedPurchase", {
    id: { type: DataTypes.UUID, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    articleId: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false },
    coins: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING(16), allowNull: false }
}, { tableName: "compras_simuladas", timestamps: true });

module.exports = { SimulatedPurchase };
