const { CoinMovement } = require('../../models/Game/coinMovementModel');
const { AccountError } = require('./accountErrors');

const walletOf = user => ({ balance: user.Doblones, revision: user.walletRevision ?? 0 });

// El llamador debe bloquear la fila de usuarios y pasar SU transacción.
// Saldo, revisión y recibo se confirman o revierten juntos.
async function changeWallet({ user, balance, kind, reason, operationKey, actorId = null, transaction }) {
    if (!transaction) throw new TypeError('Se requiere una transacción para modificar el saldo.');
    if (!Number.isSafeInteger(balance) || balance < 0 || balance > 2147483647) {
        throw new AccountError(409, 'BALANCE_LIMIT', 'El saldo debe estar entre 0 y 2.147.483.647 doblones.');
    }
    const before = walletOf(user);
    if (before.revision >= 2147483647) throw new AccountError(409, 'REVISION_LIMIT', 'La cuenta alcanzó el límite de revisiones.');
    await user.update({ Doblones: balance, walletRevision: before.revision + 1 }, { transaction });
    await CoinMovement.create({ userId: user.ID_Usuario, actorId, kind, reason, operationKey,
        delta: balance - before.balance, balanceBefore: before.balance, balanceAfter: balance,
        revisionBefore: before.revision, revisionAfter: before.revision + 1 }, { transaction });
    return walletOf(user);
}

module.exports = { walletOf, changeWallet };
