const { sequelize } = require("../config/db");
const { DataTypes } = require("sequelize");

const Article = sequelize.define("Article", {
    ID_Pass: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    Descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    Precio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 }
    },
    Doblones: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
    },
    Tipo: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: "Doblones"
    }
}, {
    tableName: "articulos",
    timestamps: false
});

module.exports = { Article };
