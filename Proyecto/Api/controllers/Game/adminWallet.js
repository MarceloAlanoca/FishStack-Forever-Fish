const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');
const User = require('../../models/userModel');
const { CoinMovement } = require('../../models/Game/coinMovementModel');
const { walletOf, changeWallet } = require('../../services/Game/wallet');
const { AccountError, sendAccountError, validRequestId } = require('../../services/Game/accountErrors');

async function updateBalance(req, res) {
    const { requestId, expectedRevision, balance, reason } = req.body || {};
    if (!validRequestId(requestId) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
        !Number.isSafeInteger(balance) || balance < 0 || balance > 2147483647 ||
        typeof reason !== 'string' || !reason.trim() || reason.trim().length > 240 ||
        Object.keys(req.body).some(key => !['requestId', 'expectedRevision', 'balance', 'reason'].includes(key))) {
        return res.status(400).json({ code: 'VALIDATION_FAILED', message: 'Indica un saldo entero válido y el motivo del ajuste (hasta 240 caracteres).' });
    }
    try {
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user) throw new AccountError(404, 'NOT_FOUND', 'Usuario no encontrado.');
            const previous = await CoinMovement.findOne({ where: { userId: user.ID_Usuario, operationKey: `admin:${requestId}` }, transaction });
            if (previous) {
                if (previous.actorId !== req.user.id || previous.balanceAfter !== balance || previous.reason !== reason.trim() || previous.revisionBefore !== expectedRevision) {
                    throw new AccountError(409, 'REQUEST_CONFLICT', 'La referencia ya corresponde a otro ajuste.');
                }
                return { wallet: walletOf(user), replayed: true };
            }
            if (walletOf(user).revision !== expectedRevision) throw new AccountError(409, 'WALLET_CONFLICT',
                'El saldo cambió desde que abriste el formulario. Actualiza los datos antes de guardar.', { wallet: walletOf(user) });
            const wallet = await changeWallet({ user, balance, kind: 'admin', reason: reason.trim(),
                actorId: req.user.id, operationKey: `admin:${requestId}`, transaction });
            return { wallet, replayed: false };
        });
        res.json(result);
    } catch (error) { sendAccountError(res, error); }
}
async function movements(req, res) {
    const before = req.query.before;
    if (before !== undefined && (typeof before !== 'string' || !/^[1-9]\d*$/.test(before) || !Number.isSafeInteger(Number(before)))) {
        return res.status(400).json({ message: 'El cursor del historial no es válido.' });
    }
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) throw new AccountError(404, 'NOT_FOUND', 'Usuario no encontrado.');
        const rows = await CoinMovement.findAll({ where: { userId: user.ID_Usuario, ...(before ? { id: { [Op.lt]: Number(before) } } : {}) },
            order: [['id', 'DESC']], limit: 21 });
        res.set('Cache-Control', 'no-store').json({ wallet: walletOf(user), movements: rows.slice(0, 20), nextCursor: rows.length > 20 ? rows[19].id : null });
    } catch (error) { sendAccountError(res, error); }
}
module.exports = { updateBalance, movements };
