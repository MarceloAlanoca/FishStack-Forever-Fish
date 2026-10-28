const { Article } = require("../models/articlesModel");
const { validText, validAmount } = require("../validations");

function validateArticle(body) {
    if (!validText(body.Nombre) || !validText(body.Descripcion, 15000) || !validText(body.Tipo, 40)) {
        return "Completa nombre, descripcion y tipo respetando sus limites de caracteres.";
    }
    if (!validAmount(body.Precio) || !validAmount(body.Doblones)) {
        return "El precio y los doblones deben ser enteros entre 0 y 2.147.483.647.";
    }
    return "";
}

function sendError(res, error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ message: "No se puede eliminar un artículo que tiene compras relacionadas." });
    }
    if (error.name === "SequelizeValidationError") {
        return res.status(400).json({ message: "Revisa los datos del artículo." });
    }
    console.error("Error al administrar artículos", error);
    return res.status(500).json({ message: "No se pudo completar la operación del artículo." });
}

async function getArticles(req, res) {
    try {
        const articles = await Article.findAll({ order: [["Precio", "ASC"], ["ID_Pass", "ASC"]] });
        res.json(articles);
    } catch (error) {
        sendError(res, error);
    }
}

async function getArticle(req, res) {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ message: "Artículo no encontrado." });
        res.json(article);
    } catch (error) {
        sendError(res, error);
    }
}

async function saveArticle(req, res) {
    const body = req.body || {};
    const message = validateArticle(body);
    if (message) return res.status(400).json({ message });

    try {
        const data = {
            Nombre: body.Nombre.trim(),
            Descripcion: body.Descripcion.trim(),
            Tipo: body.Tipo.trim(),
            Precio: body.Precio,
            Doblones: body.Doblones
        };
        if (!req.params.id) {
            const article = await Article.create(data);
            return res.status(201).json(article);
        }
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ message: "Artículo no encontrado." });
        await article.update(data);
        res.json(article);
    } catch (error) {
        sendError(res, error);
    }
}

async function deleteArticle(req, res) {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ message: "Artículo no encontrado." });
        await article.destroy();
        res.json({ message: "Artículo eliminado." });
    } catch (error) {
        sendError(res, error);
    }
}

module.exports = { getArticles, getArticle, saveArticle, deleteArticle };
