const { FishCapture } = require('../../models/Game/fishCaptureModel');
const { species } = require('../../data/Game/fishCatalog.json');
const { saveHash } = require('./gameState');
const { AccountError, validRequestId } = require('./accountErrors');

const fingerprint = fish => saveHash(0, fish);
function quote(fish, historia) {
    const entry = Object.hasOwn(species, fish.speciesId) ? species[fish.speciesId] : null;
    if (!entry || fish.nombre !== entry.name || fish.calidad !== entry.quality || !entry.icons.includes(fish.icono_path)) {
        throw new AccountError(400, 'INVALID_FISH', 'El pez no coincide con el catalogo de Historia.');
    }
    const prices = new Set([entry.basePrice]);
    const jade = historia.amuletos_equipados.includes('algas_jade');
    const coral = historia.amuletos_equipados.includes('reliquia_coral');
    if (jade) prices.add(Math.trunc(entry.basePrice) + Math.max(Math.round(entry.basePrice * .4), 1));
    if (coral) for (const value of [...prices]) prices.add(Math.round(value * 1.15));
    if (typeof fish.precio !== 'number' || !Number.isFinite(fish.precio) || fish.precio < 0 ||
        fish.precio > 2147483647 || !prices.has(fish.precio)) {
        throw new AccountError(400, 'INVALID_FISH_PRICE', 'El precio del pez no coincide con el catalogo y sus bonificaciones.');
    }
    // Elegir entre valores calculados por el servidor; nunca aceptar un delta libre.
    // La boya suma cada precio sobre un entero; Godot trunca la parte decimal.
    return Math.trunc([...prices].find(value => value === fish.precio));
}

async function registerCaptures(userId, previousState, nextState, transaction) {
    const previous = new Set(previousState.historia.bodega_barco.filter(f => f.captureId).map(f => f.captureId));
    const fish = nextState.historia.bodega_barco.filter(f => Object.keys(f).length);
    const seen = new Set();
    for (const item of [...fish].sort((a, b) => (a.captureId || '').localeCompare(b.captureId || ''))) {
        // Los snapshots antiguos siguen siendo cargables; no son vendibles hasta asignar sus IDs en Godot.
        if (!item.captureId) continue;
        if (!validRequestId(item.captureId) || seen.has(item.captureId)) {
            throw new AccountError(400, 'INVALID_CAPTURE_ID', 'Cada pez necesita un identificador UUID unico.');
        }
        seen.add(item.captureId);
        const current = await FishCapture.findByPk(item.captureId, { transaction, lock: transaction.LOCK.UPDATE });
        if (current) {
            if (current.userId !== userId || current.soldAt || !previous.has(item.captureId)) {
                throw new AccountError(409, 'CAPTURE_UNAVAILABLE', 'Un pez vendido, retirado o de otra cuenta no puede volver a la bodega.');
            }
            if (current.fingerprint !== fingerprint(item)) throw new AccountError(409, 'CAPTURE_CHANGED', 'No se pueden modificar los datos de una captura registrada.');
        } else {
            const price = quote(item, nextState.historia);
            await FishCapture.create({ captureId: item.captureId, userId, speciesId: item.speciesId,
                fingerprint: fingerprint(item), price }, { transaction });
        }
    }
}

module.exports = { registerCaptures, quote, fingerprint };
