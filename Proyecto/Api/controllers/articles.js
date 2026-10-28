const { Article } = require("../models/articlesModel");

function validateArticle(body) {
    if (typeof body.Nombre !== "string" || !body.Nombre.trim() || body.Nombre.trim().length > 255) {
        return "El nombre es obligatorio y admite hasta 255 caracteres.";
    }
    if (typeof body.Descripcion !== "string" || !body.Descripcion.trim() || body.Descripcion.length > 15000) {
        return "Ingresa una descripción de hasta 15.000 caracteres.";
    }
    if (typeof body.Tipo !== "string" || !body.Tipo.trim() || body.Tipo.trim().length > 40) {
        return "El tipo es obligatorio y admite hasta 40 caracteres.";
    }
    if (!Number.isInteger(body.Precio) || body.Precio < 0 || body.Precio > 2147483647) {
        return "El precio debe ser un número entero entre 0 y 2.147.483.647 pesos.";
    }
    if (!Number.isInteger(body.Doblones) || body.Doblones < 0 || body.Doblones > 2147483647) {
        return "La cantidad de doblones debe ser un entero entre 0 y 2.147.483.647.";
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
