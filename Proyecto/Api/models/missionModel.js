const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./userModel");

const Mission = sequelize.define("Mission", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    reward: { type: DataTypes.INTEGER, allowNull: false },
    questions: { type: DataTypes.JSON, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: "misiones", timestamps: true });

// La copia del día queda congelada: una edición administrativa solo afecta días futuros.
const DailyMission = sequelize.define("DailyMission", {
    day: { type: DataTypes.DATEONLY, primaryKey: true },
    missionId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    reward: { type: DataTypes.INTEGER, allowNull: false },
    questions: { type: DataTypes.JSON, allowNull: false }
}, { tableName: "misiones_diarias", timestamps: false });

const MissionProgress = sequelize.define("MissionProgress", {
    userId: { type: DataTypes.INTEGER, primaryKey: true, references: { model: User, key: "ID_Usuario" } },
    day: { type: DataTypes.DATEONLY, primaryKey: true, references: { model: DailyMission, key: "day" } },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    bestScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    claimedAt: { type: DataTypes.DATE, allowNull: true },
    earnedCoins: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: "progreso_misiones", timestamps: true });

module.exports = { Mission, DailyMission, MissionProgress };
