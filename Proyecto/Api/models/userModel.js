const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define(
    "User",
    {
        ID_Usuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        Nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },

        Apellido: {
            type: DataTypes.STRING,
            allowNull: false
        },

        Nombre_Vista: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        Contraseña: {
            type: DataTypes.STRING,
            allowNull: false
        },

        Rol: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "usuario"
        }
    },
    {
        tableName: "usuarios",
        timestamps: false
    }
);

module.exports = User;