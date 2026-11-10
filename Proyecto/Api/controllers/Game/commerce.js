const { sequelize } = require('../../config/db');
const User = require('../../models/userModel');
const { GameSave } = require('../../models/Game/gameSaveModel');
const { GameOperation } = require('../../models/Game/gameOperationModel');
const { saveHash } = require('../../services/Game/gameState');
const { validateRequest, applyCommerce, DECLINES, features } = require('../../services/Game/commerce');
const { changeWallet, walletOf } = require('../../services/Game/wallet');
const { AccountError, sendAccountError } = require('../../services/Game/accountErrors');
async function execute(req, res) {
    try {
        const body = validateRequest(req.body), hash = saveHash(body.baseRevision, body);
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user?.isActive || user.authVersion !== req.account.authVersion) throw new AccountError(401, 'AUTH_REQUIRED', 'Inicia sesion nuevamente.');
            const save = await GameSave.findByPk(user.ID_Usuario, { transaction, lock: transaction.LOCK.UPDATE });
            if (!save) throw new AccountError(409, 'NOT_INITIALIZED', 'Primero carga la partida.');
            const prior = await GameOperation.findOne({ where: { userId: user.ID_Usuario, requestId: body.requestId }, transaction });
            if (prior) {
                if (prior.requestHash !== hash) throw new AccountError(409, 'REQUEST_CONFLICT', 'La referencia ya corresponde a otra operacion.');
                return response(save, user, prior.result, true);
            }
            if (save.revision !== body.baseRevision) throw new AccountError(409, 'REVISION_CONFLICT', 'La partida cambio. Recarga sin sobrescribirla.', { revision: save.revision });
            if (save.revision >= 2147483647) throw new AccountError(409, 'REVISION_LIMIT', 'Limite de revisiones.');
            const change = applyCommerce(save.state, body);
            if (user.Doblones + change.delta < 0) throw new AccountError(409, 'INSUFFICIENT_FUNDS', 'No hay doblones suficientes.');
            await changeWallet({ user, balance: user.Doblones + change.delta, kind: 'game_commerce',
                reason: body.operation + ': ' + (body.itemId || body.secondaryId), operationKey: 'commerce:' + body.requestId, transaction });
            await save.update({ state: change.state, revision: save.revision + 1, lastRequestId: null, lastRequestHash: null }, { transaction });
            const receipt = { requestId: body.requestId, operation: body.operation, revision: save.revision, total: change.total, request: body };
            await GameOperation.create({ userId: user.ID_Usuario, requestId: body.requestId, requestHash: hash, result: receipt }, { transaction });
            return response(save, user, receipt, false);
        });
        res.set('Cache-Control', 'no-store').json(result);
    } catch (error) {
        // These explicit business rejections are returned only after rollback.
        if (error instanceof AccountError && DECLINES.has(error.code)) error.details = { ...error.details, committed: false };
        sendAccountError(res, error);
    }
}
function response(save, user, receipt, replayed) {
    return { accountId: String(user.ID_Usuario), exists: true, schemaVersion: 1, revision: save.revision,
        state: save.state, updatedAt: save.updatedAt, wallet: walletOf(user), receipt, replayed, features };
}
module.exports = { execute };
