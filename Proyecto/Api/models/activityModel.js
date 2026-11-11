const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./userModel");

const Activity = sequelize.define("Activity", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: "ID_Usuario" } },
    message: { type: DataTypes.STRING(512), allowNull: false }
}, {
    tableName: "actividad_usuarios",
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ["userId", "createdAt"] }]
});

module.exports = { Activity };
