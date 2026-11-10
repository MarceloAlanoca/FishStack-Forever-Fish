const { features: commerceFeatures } = require('../../services/Game/commerce');
const { sequelize } = require('../../config/db');
const User = require('../../models/userModel');
const { GameSave } = require('../../models/Game/gameSaveModel');
const { initialState, validateState, saveHash } = require('../../services/Game/gameState');
const { walletOf } = require('../../services/Game/wallet');
const { registerCaptures } = require('../../services/Game/fishCaptures');
const { AccountError, sendAccountError, validRequestId } = require('../../services/Game/accountErrors');

function serialize(save, user, isNew = false) {
    return { accountId: String(user.ID_Usuario), exists: Boolean(save), isNew,
        schemaVersion: 1, revision: save?.revision ?? 0, updatedAt: save?.updatedAt ?? null,
        state: save?.state ?? null, wallet: walletOf(user), features: commerceFeatures };
}
async function lockedAccount(req, transaction) {
    const user = await User.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user?.isActive || user.authVersion !== req.account.authVersion) throw new AccountError(401, 'AUTH_REQUIRED', 'Inicia sesión nuevamente.');
    return user;
}
async function load(req, res) {
    try {
        const result = await sequelize.transaction(async transaction => {
            const user = await lockedAccount(req, transaction);
            return serialize(await GameSave.findByPk(user.ID_Usuario, { transaction }), user);
        });
        res.set('Cache-Control', 'no-store').json(result);
    } catch (error) { sendAccountError(res, error); }
}
async function initialize(req, res) {
    if (Object.keys(req.body || {}).length) return res.status(400).json({ code: 'VALIDATION_FAILED', message: 'La partida inicial la genera el servidor.' });
    try {
        const result = await sequelize.transaction(async transaction => {
            const user = await lockedAccount(req, transaction);
            let save = await GameSave.findByPk(user.ID_Usuario, { transaction });
            const isNew = !save;
            if (!save) save = await GameSave.create({ userId: user.ID_Usuario, schemaVersion: 1, revision: 1, state: initialState() }, { transaction });
            return serialize(save, user, isNew);
        });
        res.set('Cache-Control', 'no-store').status(result.isNew ? 201 : 200).json(result);
    } catch (error) { sendAccountError(res, error); }
}
async function save(req, res) {
    const { requestId, baseRevision, state } = req.body || {};
    if (!validRequestId(requestId) || !Number.isSafeInteger(baseRevision) || baseRevision < 1 ||
        Object.keys(req.body).some(key => !['requestId', 'baseRevision', 'state'].includes(key))) {
        return res.status(400).json({ code: 'VALIDATION_FAILED', message: 'La referencia o la revisión de partida no es válida.' });
    }
    try {
        validateState(state);
        const hash = saveHash(baseRevision, state);
        const result = await sequelize.transaction(async transaction => {
            const user = await lockedAccount(req, transaction);
            const current = await GameSave.findByPk(user.ID_Usuario, { transaction, lock: transaction.LOCK.UPDATE });
            if (!current) throw new AccountError(409, 'NOT_INITIALIZED', 'Primero carga o crea la partida de la cuenta.');
            if (current.lastRequestId === requestId) {
                if (current.lastRequestHash !== hash) throw new AccountError(409, 'REQUEST_CONFLICT', 'La referencia ya corresponde a otro guardado.');
                return serialize(current, user);
            }
            if (current.revision !== baseRevision) throw new AccountError(409, 'REVISION_CONFLICT',
                'Hay un guardado más reciente. No se reemplazó la partida de la cuenta.', { revision: current.revision });
            if (current.revision >= 2147483647) throw new AccountError(409, 'REVISION_LIMIT', 'Se alcanzó el límite de revisiones.');
            await registerCaptures(user.ID_Usuario, current.state, state, transaction);
            await current.update({ state, revision: current.revision + 1, lastRequestId: requestId, lastRequestHash: hash }, { transaction });
            return serialize(current, user);
        });
        res.set('Cache-Control', 'no-store').json(result);
    } catch (error) { sendAccountError(res, error); }
}
function wallet(req, res) { res.set('Cache-Control', 'no-store').json({ accountId: String(req.user.id), wallet: walletOf(req.account) }); }

module.exports = { load, initialize, save, wallet };
