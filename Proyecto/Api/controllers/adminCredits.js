const { CreditIntegrante } = require("../models/creditsIntegrantesModel");
const { CreditInspiracion } = require("../models/creditsInspiracionesModel");
const { validText, validAmount } = require("../validations");

const sections = {
    integrantes: {
        model: CreditIntegrante,
        texts: { nombre: 100, rol: 100, descripcion: 15000, detalle: 15000, aporte: 15000, imagen: 2048, video: 2048 },
        media: ["imagen", "video"]
    },
    inspiraciones: {
        model: CreditInspiracion,
        texts: { nombre: 100, descripcion: 15000, clase: 100, portada: 2048, video: 2048, link: 2048, inspiracion: 15000 },
        media: ["portada", "video", "link"]
    }
};

function validMedia(value, externalOnly = false) {
    if (!externalOnly && value.startsWith("/") && !value.startsWith("//")) return true;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function validateCredit(body, section) {
    const fields = Object.keys(section.texts);
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        // Detalle y aporte pueden quedar vacios, como en los creditos iniciales.
        if (field === "detalle" || field === "aporte") {
            if (typeof body[field] !== "string" || body[field].length > section.texts[field]) return "Revisa el detalle y el aporte.";
        } else if (!validText(body[field], section.texts[field])) {
            return "Completa los campos y respeta sus limites de caracteres.";
        }
    }
    if (!validAmount(body.orden) || (section.model === CreditInspiracion && !validAmount(body.segundoInicio))) {
        return "El orden y el segundo inicial deben ser numeros enteros positivos o cero.";
    }
    for (let i = 0; i < section.media.length; i++) {
        const field = section.media[i];
        if (!validMedia(body[field].trim(), field === "link")) return "Usa rutas locales que empiecen con / o enlaces HTTP/HTTPS. El enlace del juego debe ser HTTP/HTTPS.";
    }
    return "";
}

function creditSection(req, res, next) {
    // Seleccion explicita: ninguna tabla se elige directamente desde la URL.
    const section = Object.hasOwn(sections, req.params.tipo) ? sections[req.params.tipo] : null;
    if (!section) return res.status(404).json({ message: "Seccion de creditos no encontrada." });
    req.creditSection = section;
    next();
}

function sendError(res, error) {
    console.error("Error al administrar creditos", error.name);
    res.status(500).json({ message: "No se pudo completar la operacion de creditos." });
}

async function listCredits(req, res) {
    try {
        const records = await req.creditSection.model.findAll({ order: [["orden", "ASC"], ["id", "ASC"]] });
        res.json(records);
    } catch (error) { sendError(res, error); }
}

async function getCredit(req, res) {
    try {
        const record = await req.creditSection.model.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: "Credito no encontrado." });
        res.json(record);
    } catch (error) { sendError(res, error); }
}

async function saveCredit(req, res) {
    const body = req.body || {};
    const section = req.creditSection;
    const message = validateCredit(body, section);
    if (message) return res.status(400).json({ message });
    const data = { orden: body.orden };
    const fields = Object.keys(section.texts);
    for (let i = 0; i < fields.length; i++) data[fields[i]] = body[fields[i]].trim();
    if (section.model === CreditInspiracion) data.segundoInicio = body.segundoInicio;
    try {
        if (!req.params.id) return res.status(201).json(await section.model.create(data));
        const record = await section.model.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: "Credito no encontrado." });
        await record.update(data);
        res.json(record);
    } catch (error) { sendError(res, error); }
}

async function deleteCredit(req, res) {
    try {
        const record = await req.creditSection.model.findByPk(req.params.id);
        if (!record) return res.status(404).json({ message: "Credito no encontrado." });
        await record.destroy();
        res.json({ message: "Credito eliminado." });
    } catch (error) { sendError(res, error); }
}

module.exports = { creditSection, listCredits, getCredit, saveCredit, deleteCredit };
