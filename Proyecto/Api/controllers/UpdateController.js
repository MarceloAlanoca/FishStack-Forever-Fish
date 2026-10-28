const { Updates } = require("../models/UpdateModel");
const { saveUpdateImage, removeUpdateImage } = require("../middlewares/updateImage");

function validateUpdate(body) {
    const fields = ["Nombre", "Version", "Tipo", "Descripcion_Inicial", "Detalle"];
    const limits = [100, 40, 40, 200, 15000];
    for (let i = 0; i < fields.length; i++) {
        const value = body[fields[i]];
        if (typeof value !== "string" || !value.trim() || value.length > limits[i]) {
            return "Completa los textos y respeta el máximo de caracteres de cada campo.";
        }
    }
    if (typeof body.Fecha !== "string" || !Number.isFinite(Date.parse(body.Fecha))) {
        return "Ingresa una fecha válida.";
    }
    const year = new Date(body.Fecha).getUTCFullYear();
    if (year < 1000 || year > 9999) return "Ingresa una fecha entre los años 1000 y 9999.";
    return "";
}

function sendError(res, error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(409).json({ message: "No se puede eliminar una publicación que tiene registros relacionados." });
    }
    if (error.name === "SequelizeValidationError") {
        return res.status(400).json({ message: "Revisa los datos de la publicación." });
    }
    console.error("Error en actualizaciones", error);
    return res.status(500).json({ message: "No se pudo completar la operación de la actualización." });
}

async function getUpdates(req, res) {
    try {
        const updates = await Updates.findAll({
            attributes: ["ID_Update", "Nombre", "Version", "Tipo", "Descripcion_Inicial", "Imagen", "Fecha"],
            order: [["Fecha", "DESC"], ["ID_Update", "DESC"]]
        });
        res.json(updates);
    } catch (error) {
        sendError(res, error);
    }
}

async function getUpdatesByID(req, res) {
    if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
        return res.status(400).json({ message: "El identificador de actualización no es válido." });
    }
    try {
        const update = await Updates.findByPk(req.params.id);
        if (!update) return res.status(404).json({ message: "Actualización no encontrada." });
        res.json(update);
    } catch (error) {
        sendError(res, error);
    }
}

async function saveUpdate(req, res) {
    const body = req.body || {};
    const message = validateUpdate(body);
    if (message) return res.status(400).json({ message });
    if (req.file && body.Quitar_Imagen === "true") {
        return res.status(400).json({ message: "Elige entre reemplazar la imagen o quitarla." });
    }

    let newImage = null;
    let saved = false;
    try {
        let update;
        if (req.params.id) {
            update = await Updates.findByPk(req.params.id);
            if (!update) return res.status(404).json({ message: "Actualización no encontrada." });
        }
        const previousImage = update?.Imagen || null;
        const data = {
            Nombre: body.Nombre.trim(),
            Version: body.Version.trim(),
            Tipo: body.Tipo.trim(),
            Descripcion_Inicial: body.Descripcion_Inicial.trim(),
            Detalle: body.Detalle.trim(),
            Fecha: new Date(body.Fecha),
            Imagen: previousImage
        };
        if (req.file) {
            newImage = await saveUpdateImage(req.file);
            data.Imagen = newImage;
        } else if (body.Quitar_Imagen === "true") {
            data.Imagen = null;
        }

        if (update) {
            await update.update(data);
        } else {
            update = await Updates.create(data);
        }
        saved = true;
        if (previousImage !== data.Imagen) await removeUpdateImage(previousImage);
        res.status(req.params.id ? 200 : 201).json(update);
    } catch (error) {
        if (newImage && !saved) await removeUpdateImage(newImage);
        sendError(res, error);
    }
}

async function deleteUpdate(req, res) {
    try {
        const update = await Updates.findByPk(req.params.id);
        if (!update) return res.status(404).json({ message: "Actualización no encontrada." });
        await update.destroy();
        await removeUpdateImage(update.Imagen);
        res.json({ message: "Actualización eliminada." });
    } catch (error) {
        sendError(res, error);
    }
}

module.exports = { getUpdates, getUpdatesByID, saveUpdate, deleteUpdate };
