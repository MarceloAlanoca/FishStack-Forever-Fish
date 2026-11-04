const { Mission, DailyMission } = require("../models/missionModel");

function missionDay(now = new Date()) {
    // El día lo decide el servidor; modificar el reloj del navegador no adelanta premios.
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const get = type => parts.find(part => part.type === type).value;
    return `${get("year")}-${get("month")}-${get("day")}`;
}

function validateMission(body) {
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 100 ||
        typeof body.description !== "string" || !body.description.trim() || body.description.length > 500 ||
        !Number.isInteger(body.reward) || body.reward < 1 || body.reward > 1000 || typeof body.active !== "boolean") {
        return "Completa título, descripción y una recompensa entera de 1 a 1000 doblones.";
    }
    if (!Array.isArray(body.questions) || body.questions.length !== 3) return "Cada misión debe tener exactamente tres preguntas.";
    for (const question of body.questions) {
        if (!question || typeof question.text !== "string" || !question.text.trim() || question.text.length > 240 ||
            !Array.isArray(question.options) || question.options.length !== 3 ||
            question.options.some(option => typeof option !== "string" || !option.trim() || option.length > 160) ||
            new Set(question.options.map(option => option.trim().toLowerCase())).size !== 3 ||
            !Number.isInteger(question.correct) || question.correct < 0 || question.correct > 2 ||
            typeof question.explanation !== "string" || !question.explanation.trim() || question.explanation.length > 500) {
            return "Cada pregunta requiere enunciado, tres opciones distintas, respuesta correcta y explicación.";
        }
    }
    return "";
}

function sanitizeMission(body) {
    return { title: body.title.trim(), description: body.description.trim(), reward: body.reward, active: body.active,
        questions: body.questions.map(question => ({ text: question.text.trim(), options: question.options.map(option => option.trim()),
            correct: question.correct, explanation: question.explanation.trim() })) };
}

async function getDailyMission(day) {
    const existing = await DailyMission.findByPk(day);
    if (existing) return existing;
    const missions = await Mission.findAll({ where: { active: true }, order: [["id", "ASC"]] });
    if (!missions.length) return null;
    const index = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000) % missions.length;
    const selected = missions[index];
    // La PK por día y findOrCreate resuelven dos primeras visitas simultáneas.
    const [daily] = await DailyMission.findOrCreate({ where: { day }, defaults: {
        missionId: selected.id, title: selected.title, description: selected.description,
        reward: selected.reward, questions: selected.questions
    } });
    return daily;
}

function publicMission(daily, completed = false) {
    return { day: daily.day, title: daily.title, description: daily.description, reward: daily.reward,
        questions: daily.questions.map(question => ({ text: question.text, options: question.options,
            ...(completed ? { correct: question.correct, explanation: question.explanation } : {}) })) };
}

module.exports = { missionDay, validateMission, sanitizeMission, getDailyMission, publicMission };
