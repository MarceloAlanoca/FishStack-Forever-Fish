const { sequelize } = require("../config/db");
const { DataTypes } = require("sequelize");

const CreditIntegrante = sequelize.define("CreditIntegrante", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    rol: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    detalle: { type: DataTypes.TEXT, allowNull: false },
    aporte: { type: DataTypes.TEXT, allowNull: false },
    imagen: { type: DataTypes.STRING(2048), allowNull: false },
    video: { type: DataTypes.STRING(2048), allowNull: false }
}, {
    tableName: "creditos_integrantes",
    timestamps: false
});

module.exports = { CreditIntegrante };
