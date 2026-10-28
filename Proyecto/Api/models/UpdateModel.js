const { sequelize } = require("../config/db");
const { DataTypes } = require("sequelize");

const Updates = sequelize.define("Updates", {
    ID_Update: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Version: {
        type: DataTypes.STRING(40),
        allowNull: false
    },
    Tipo: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: "Actualización"
    },
    Descripcion_Inicial: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    Detalle: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    Imagen: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    Fecha: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: "updates",
    timestamps: false
});

module.exports = { Updates };
