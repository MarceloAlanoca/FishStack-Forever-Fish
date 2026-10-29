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

        Correo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },

        Usuario: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        Contraseña: {
            type: DataTypes.STRING,
            allowNull: false
        },

        Foto_Perfil: {
            type: DataTypes.STRING(255),
            allowNull: true
        },

        Doblones: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0, max: 2147483647, isInt: true }
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },

        resetTokenHash: { type: DataTypes.STRING(64), allowNull: true, unique: true },
        resetExpiresAt: { type: DataTypes.DATE, allowNull: true },
        authVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

        Rol: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "usuario"
        }
    },
    {
        tableName: "usuarios",
        defaultScope: { attributes: { exclude: ["resetTokenHash", "resetExpiresAt"] } },
        timestamps: false
    }
);

module.exports = User;
