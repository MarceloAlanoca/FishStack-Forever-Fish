const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { Updates } = require('../models/UpdateModel');
const { UpdatesComentarios } = require('../models/UpdateComentariosModel');
const { UpdateLike } = require('../models/UpdateLikeModel');

const author = { association: 'Autor', attributes: ['Usuario', 'Foto_Perfil', 'isActive'] };

function serializeComment(comment) {
    const data = comment.toJSON();
    return {
        ID_Comentario: data.ID_Comentario,
        ID_Usuario: data.ID_Usuario,
        Texto: data.Texto,
        Fecha: data.createdAt,
        Editado: data.Editado,
        Autor: {
            Usuario: data.Autor?.isActive ? data.Autor.Usuario : 'Cuenta eliminada',
            Foto_Perfil: data.Autor?.isActive ? data.Autor.Foto_Perfil : null
        }
    };
}

function fail(res, error) {
    console.error('Error en interacciones de Logs:', error.name);
    res.status(500).json({ message: 'No se pudo completar la operación. Intenta nuevamente.' });
}

function validText(value) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 1000;
}

async function getCommunity(req, res) {
    const cursor = req.query.before;
    if (cursor !== undefined && (typeof cursor !== 'string' || !/^[1-9]\d*$/.test(cursor) || !Number.isSafeInteger(Number(cursor)))) {
        return res.status(400).json({ message: 'El cursor de comentarios no es válido.' });
    }
    try {
        if (!await Updates.findByPk(req.params.id)) return res.status(404).json({ message: 'Actualización no encontrada.' });
        const where = { ID_Update: req.params.id };
        const [comments, commentCount, likeCount] = await Promise.all([
            UpdatesComentarios.findAll({
                where: { ...where, ...(cursor ? { ID_Comentario: { [Op.lt]: Number(cursor) } } : {}) },
                include: [author], order: [['ID_Comentario', 'DESC']], limit: 21
            }),
            UpdatesComentarios.count({ where }),
            UpdateLike.count({ where })
        ]);
        const page = comments.slice(0, 20);
        res.json({ comments: page.map(serializeComment), commentCount, likeCount,
            nextCursor: comments.length > 20 ? page.at(-1).ID_Comentario : null });
    } catch (error) { fail(res, error); }
}

async function getMyLike(req, res) {
    try {
        if (!await Updates.findByPk(req.params.id)) return res.status(404).json({ message: 'Actualización no encontrada.' });
        const where = { ID_Update: req.params.id };
        const [like, likeCount] = await Promise.all([
            UpdateLike.findOne({ where: { ...where, ID_Usuario: req.user.id } }),
            UpdateLike.count({ where })
        ]);
        res.json({ liked: Boolean(like), likeCount });
    } catch (error) { fail(res, error); }
}

// Todas las escrituras bloquean primero la publicación, también al eliminarla desde el CRUD.
// Esto serializa los cambios concurrentes y evita referencias a publicaciones eliminadas.
async function mutate(req, res, action) {
    try {
        const result = await sequelize.transaction(async transaction => {
            const update = await Updates.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!update) return { status: 404, body: { message: 'Actualización no encontrada.' } };
            return action(transaction);
        });
        res.status(result.status || 200).json(result.body);
    } catch (error) { fail(res, error); }
}

async function createComment(req, res) {
    if (!validText(req.body?.Texto)) return res.status(400).json({ message: 'Escribe un comentario de entre 1 y 1000 caracteres.' });
    return mutate(req, res, async transaction => {
        const comment = await UpdatesComentarios.create({
            ID_Update: req.params.id, ID_Usuario: req.user.id,
            Texto: req.body.Texto.trim(), Fecha: new Date().toISOString()
        }, { transaction });
        await comment.reload({ include: [author], transaction });
        const commentCount = await UpdatesComentarios.count({ where: { ID_Update: req.params.id }, transaction });
        return { status: 201, body: { comment: serializeComment(comment), commentCount } };
    });
}

async function editComment(req, res) {
    if (!validText(req.body?.Texto)) return res.status(400).json({ message: 'Escribe un comentario de entre 1 y 1000 caracteres.' });
    return mutate(req, res, async transaction => {
        const comment = await UpdatesComentarios.findOne({
            where: { ID_Comentario: req.params.commentId, ID_Update: req.params.id }, transaction
        });
        if (!comment) return { status: 404, body: { message: 'Comentario no encontrado.' } };
        if (comment.ID_Usuario !== req.user.id) return { status: 403, body: { message: 'Solo puedes editar tus propios comentarios.' } };
        await comment.update({ Texto: req.body.Texto.trim(), Editado: true }, { transaction });
        await comment.reload({ include: [author], transaction });
        return { body: { comment: serializeComment(comment) } };
    });
}

async function deleteComment(req, res) {
    return mutate(req, res, async transaction => {
        const comment = await UpdatesComentarios.findOne({
            where: { ID_Comentario: req.params.commentId, ID_Update: req.params.id }, transaction
        });
        if (!comment) return { status: 404, body: { message: 'Comentario no encontrado.' } };
        if (comment.ID_Usuario !== req.user.id && req.user.rol?.toLowerCase() !== 'administrador') {
            return { status: 403, body: { message: 'No tienes permiso para eliminar este comentario.' } };
        }
        await comment.destroy({ transaction });
        const commentCount = await UpdatesComentarios.count({ where: { ID_Update: req.params.id }, transaction });
        return { body: { commentCount } };
    });
}

async function setLike(req, res) {
    return mutate(req, res, async transaction => {
        const where = { ID_Update: req.params.id, ID_Usuario: req.user.id };
        const liked = req.method === 'PUT';
        // PUT y DELETE son idempotentes: repetir una solicitud no invierte el resultado.
        if (liked) await UpdateLike.findOrCreate({ where, transaction });
        else await UpdateLike.destroy({ where, transaction });
        const likeCount = await UpdateLike.count({ where: { ID_Update: req.params.id }, transaction });
        return { body: { liked, likeCount } };
    });
}

module.exports = { getCommunity, getMyLike, createComment, editComment, deleteComment, setLike };
