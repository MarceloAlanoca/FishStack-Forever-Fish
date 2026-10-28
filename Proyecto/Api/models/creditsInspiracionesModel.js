const { sequelize } = require("../config/db");
const { DataTypes } = require("sequelize");

const CreditInspiracion = sequelize.define("CreditInspiracion", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    clase: { type: DataTypes.STRING(100), allowNull: false },
    portada: { type: DataTypes.STRING(2048), allowNull: false },
    video: { type: DataTypes.STRING(2048), allowNull: false },
    segundoInicio: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    link: { type: DataTypes.STRING(2048), allowNull: false },
    inspiracion: { type: DataTypes.TEXT, allowNull: false }
}, {
    tableName: "creditos_inspiraciones",
    timestamps: false
});

module.exports = { CreditInspiracion };
