const { sequelize } = require('../../config/db');
const User = require('../../models/userModel');
const { GameSave } = require('../../models/Game/gameSaveModel');
const { FishCapture } = require('../../models/Game/fishCaptureModel');
const { GameOperation } = require('../../models/Game/gameOperationModel');
const { validateState, saveHash } = require('../../services/Game/gameState');
const { fingerprint } = require('../../services/Game/fishCaptures');
const { changeWallet, walletOf } = require('../../services/Game/wallet');
const { AccountError, sendAccountError, validRequestId } = require('../../services/Game/accountErrors');

async function sell(req, res) {
    const { requestId, baseRevision, captureIds } = req.body || {};
    if (!validRequestId(requestId) || !Number.isSafeInteger(baseRevision) || baseRevision < 1 ||
        !Array.isArray(captureIds) || !captureIds.length || captureIds.length > 100 ||
        !captureIds.every(validRequestId) || new Set(captureIds).size !== captureIds.length ||
        Object.keys(req.body).some(key => !['requestId', 'baseRevision', 'captureIds'].includes(key))) {
        return res.status(400).json({ code: 'VALIDATION_FAILED', message: 'Indica la revision y las capturas de la bodega, sin precios ni saldos.' });
    }
    const ids = [...captureIds].sort();
    const hash = saveHash(baseRevision, { operation: 'SELL_FISH', captureIds: ids });
    try {
        const result = await sequelize.transaction(async transaction => {
            const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!user?.isActive || user.authVersion !== req.account.authVersion) throw new AccountError(401, 'AUTH_REQUIRED', 'Inicia sesion nuevamente.');
            const current = await GameSave.findByPk(user.ID_Usuario, { transaction, lock: transaction.LOCK.UPDATE });
            if (!current) throw new AccountError(409, 'NOT_INITIALIZED', 'Primero carga la partida de la cuenta.');
            const receipt = await GameOperation.findOne({ where: { userId: user.ID_Usuario, requestId }, transaction });
            if (receipt) {
                if (receipt.requestHash !== hash) throw new AccountError(409, 'REQUEST_CONFLICT', 'La referencia ya corresponde a otra venta.');
                return response(current, user, receipt.result, true);
            }
            if (current.revision !== baseRevision) throw new AccountError(409, 'REVISION_CONFLICT', 'La partida cambio. No se vendieron peces.', { revision: current.revision });
            if (current.revision >= 2147483647) throw new AccountError(409, 'REVISION_LIMIT', 'Se alcanzo el limite de revisiones.');
            validateState(current.state);
            const fish = current.state.historia.bodega_barco.filter(f => Object.keys(f).length);
            if (fish.length !== ids.length || fish.some(f => !ids.includes(f.captureId)) || new Set(fish.map(f => f.captureId)).size !== fish.length) {
                throw new AccountError(409, 'BODEGA_CHANGED', 'Las capturas no coinciden con toda la bodega guardada. Guarda el progreso antes de vender.');
            }
            const captures = [];
            let total = 0;
            for (const id of ids) {
                const capture = await FishCapture.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
                if (!capture || capture.userId !== user.ID_Usuario || capture.soldAt) throw new AccountError(409, 'CAPTURE_UNAVAILABLE', 'La captura no esta disponible para vender.');
                if (capture.fingerprint !== fingerprint(fish.find(f => f.captureId === id))) throw new AccountError(409, 'CAPTURE_CHANGED', 'La captura no coincide con su registro.');
                total += capture.price;
                captures.push(capture);
            }
            const state = structuredClone(current.state);
            state.historia.bodega_barco = state.historia.bodega_barco.map(() => ({}));
            state.historia.peso_actual_bodega = 0;
            await changeWallet({ user, balance: user.Doblones + total, kind: 'fish_sale', reason: `Venta de ${ids.length} peces`,
                operationKey: `sale:${requestId}`, transaction });
            await current.update({ state, revision: current.revision + 1, lastRequestId: null, lastRequestHash: null }, { transaction });
            const soldAt = new Date();
            for (const capture of captures) await capture.update({ soldAt }, { transaction });
            const sale = { requestId, total, soldCount: ids.length, captureIds: ids, revision: current.revision };
            await GameOperation.create({ userId: user.ID_Usuario, requestId, requestHash: hash, result: sale }, { transaction });
            return response(current, user, sale, false);
        });
        res.set('Cache-Control', 'no-store').json(result);
    } catch (error) { sendAccountError(res, error); }
}
function response(save, user, sale, replayed) {
    return { accountId: String(user.ID_Usuario), exists: true, schemaVersion: 1, revision: save.revision,
        updatedAt: save.updatedAt, state: save.state, wallet: walletOf(user), sale, replayed };
}
module.exports = { sell };
