const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("../models/userModel");
const { Mission, DailyMission, MissionProgress } = require("../models/missionModel");
const { missionDay, getDailyMission, publicMission, validateMission, sanitizeMission } = require("../services/missions");

function fail(res, error) {
    console.error("Error en misiones", error.name);
    return res.status(500).json({ message: "No se pudo completar la operación. Inténtalo nuevamente." });
}

async function overview(req, res) {
    try {
        const day = missionDay();
        const daily = await getDailyMission(day);
        const progress = await MissionProgress.findOne({ where: { userId: req.user.id, day } });
        const history = await MissionProgress.findAll({ where: { userId: req.user.id }, order: [["day", "DESC"]], limit: 10 });
        const earned = await MissionProgress.sum("earnedCoins", { where: { userId: req.user.id } });
        const completed = await MissionProgress.count({ where: { userId: req.user.id, completedAt: { [Op.ne]: null } } });
        res.json({ day, timezone: "America/Argentina/Buenos_Aires", mission: daily ? publicMission(daily, Boolean(progress?.completedAt)) : null,
            progress, history, stats: { earned: earned || 0, completed } });
    } catch (error) { fail(res, error); }
}

async function act(req, res, claim) {
    const day = missionDay();
    if (req.body?.day !== day) return res.status(409).json({ message: "El día cambió. Actualiza la bitácora para ver la misión nueva." });
    if (Object.keys(req.body || {}).some(key => !["day", ...(claim ? [] : ["answers"])].includes(key))) {
        return res.status(400).json({ message: "La solicitud contiene campos no permitidos." });
    }
    const answers = req.body.answers;
    if (!claim && (!Array.isArray(answers) || answers.length !== 3 || answers.some(value => !Number.isInteger(value) || value < 0 || value > 2))) {
        return res.status(400).json({ message: "Selecciona una respuesta para cada una de las tres preguntas." });
    }
    try {
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user?.isActive || user.authVersion !== req.account.authVersion) return { code: 401, message: "Inicia sesión nuevamente." };
            const daily = await DailyMission.findByPk(day, { transaction });
            if (!daily) return { code: 404, message: "Abre la bitácora para consultar la misión disponible." };
            let progress = await MissionProgress.findOne({ where: { userId: user.ID_Usuario, day }, transaction });
            if (claim) {
                if (!progress?.completedAt) return { code: 409, message: "Completa la misión antes de reclamar la recompensa." };
                if (progress.claimedAt) return { balance: user.Doblones, alreadyClaimed: true, progress };
                if (user.Doblones + daily.reward > 2147483647) return { code: 409, message: "La recompensa supera el límite de saldo de la cuenta." };
                await user.update({ Doblones: user.Doblones + daily.reward }, { transaction });
                await progress.update({ claimedAt: new Date(), earnedCoins: daily.reward }, { transaction });
                return { balance: user.Doblones, alreadyClaimed: false, progress };
            }
            if (progress?.completedAt) return { progress, mission: publicMission(daily, true), score: 3 };
            if (!progress) progress = await MissionProgress.create({ userId: user.ID_Usuario, day }, { transaction });
            const score = daily.questions.reduce((total, question, index) => total + Number(question.correct === answers[index]), 0);
            await progress.update({ attempts: progress.attempts + 1, bestScore: Math.max(progress.bestScore, score),
                completedAt: score === 3 ? new Date() : null }, { transaction });
            return { progress, score, mission: publicMission(daily, score === 3) };
        });
        if (result.code) return res.status(result.code).json({ message: result.message });
        res.json(result);
    } catch (error) { fail(res, error); }
}

const submit = (req, res) => act(req, res, false);
const claim = (req, res) => act(req, res, true);

async function list(req, res) {
    try { res.json(await Mission.findAll({ order: [["id", "ASC"]] })); }
    catch (error) { fail(res, error); }
}

async function save(req, res) {
    const message = validateMission(req.body || {});
    if (message) return res.status(400).json({ message });
    if (req.params.id && !/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ message: "Identificador inválido." });
    try {
        const data = sanitizeMission(req.body);
        if (!req.params.id) return res.status(201).json(await Mission.create(data));
        const mission = await Mission.findByPk(req.params.id);
        if (!mission) return res.status(404).json({ message: "Misión no encontrada." });
        res.json(await mission.update(data));
    } catch (error) { fail(res, error); }
}

module.exports = { overview, submit, claim, list, save };
