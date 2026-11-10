const fs = require('node:fs');
const { createHash } = require('node:crypto');
const rawCatalog = fs.readFileSync(require.resolve('../../data/Game/commerceCatalog.json'));
const catalog = JSON.parse(rawCatalog);
const catalogHash = createHash('sha256').update(rawCatalog).digest('hex');
const { AccountError, validRequestId } = require('./accountErrors');
const { validateState } = require('./gameState');
const operations = new Set(['BUY_ITEM', 'RECYCLE_ITEMS', 'UPGRADE_SECONDARY']);
const DECLINES = new Set(['INSUFFICIENT_FUNDS', 'ALREADY_OWNED', 'INVENTORY_FULL', 'LEVEL_LIMIT', 'BALANCE_LIMIT', 'INCOMPATIBLE_SKIN', 'WRONG_SHOP']);
const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
function fail(code, message, status = 409) { throw new AccountError(status, code, message); }
function validateRequest(body) {
    if (!body || !operations.has(body.operation) || !validRequestId(body.requestId) || !integer(body.baseRevision, 1, 2147483647)) fail('VALIDATION_FAILED', 'Referencia, revision u operacion no valida.', 400);
    const extra = body.operation === 'BUY_ITEM' ? ['itemId', 'quantity'] : body.operation === 'RECYCLE_ITEMS' ? ['inventory', 'slotIndex', 'itemId', 'quantity'] : ['secondaryId', 'expectedLevel'];
    const keys = ['requestId', 'baseRevision', 'operation', ...extra];
    if (Object.keys(body).length !== keys.length || Object.keys(body).some(key => !keys.includes(key))) fail('VALIDATION_FAILED', 'No envies precios, saldos, deltas ni estado.', 400);
    if (body.operation === 'UPGRADE_SECONDARY') {
        if (!Object.hasOwn(catalog.upgrades, body.secondaryId) || !integer(body.expectedLevel, 0, 5)) fail('VALIDATION_FAILED', 'Mejora no valida.', 400);
    } else {
        if (typeof body.itemId !== 'string' || !Object.hasOwn(catalog.items, body.itemId) || !integer(body.quantity, 1, 64)) fail('VALIDATION_FAILED', 'Articulo o cantidad no validos.', 400);
        if (body.operation === 'RECYCLE_ITEMS' && (!['inventario_mochila', 'inventario_almacen'].includes(body.inventory) || !integer(body.slotIndex, 0, body.inventory === 'inventario_mochila' ? 7 : 47))) fail('VALIDATION_FAILED', 'Slot no valido.', 400);
    }
    return body;
}
function applyCommerce(previous, body) {
    validateRequest(body);
    validateState(previous);
    const state = structuredClone(previous), h = state.historia;
    let delta = 0;
    if (body.operation === 'BUY_ITEM') {
        const item = catalog.items[body.itemId];
        if (!item.worlds.includes(h.mundo_historia_actual)) fail('WRONG_SHOP', 'Ese articulo no pertenece a la tienda del mundo actual.');
        if (item.owner && !['percy', 'robo_stack', h.personaje_seleccionado].includes(item.owner)) fail('INCOMPATIBLE_SKIN', 'La skin no corresponde al personaje seleccionado.');
        if (!item.stackable) {
            if (body.quantity !== 1) fail('VALIDATION_FAILED', 'Un articulo permanente se compra de a uno.', 400);
            if (h[item.ownedField].includes(body.itemId)) fail('ALREADY_OWNED', 'Ya tenes ese articulo.');
            h[item.ownedField].push(body.itemId);
            const acquired = h.items_adquiridos_por_mundo[h.mundo_historia_actual];
            if (!acquired.includes(body.itemId)) acquired.push(body.itemId);
        } else {
            let left = body.quantity;
            const slots = [...h.inventario_mochila, ...h.inventario_almacen];
            for (const slot of slots) if (slot.id === body.itemId && left) { const n = Math.min(64 - slot.cantidad, left); slot.cantidad += n; left -= n; }
            for (const slot of slots) if (!Object.keys(slot).length && left) { const n = Math.min(64, left); Object.assign(slot, { id: body.itemId, cantidad: n }); left -= n; }
            if (left) fail('INVENTORY_FULL', 'No hay espacio en mochila ni almacen.');
        }
        delta = -item.price * body.quantity;
    } else if (body.operation === 'RECYCLE_ITEMS') {
        const item = catalog.items[body.itemId], slot = h[body.inventory][body.slotIndex];
        if (!item.stackable) fail('VALIDATION_FAILED', 'Solo se reciclan consumibles y cebos.', 400);
        if (slot.id !== body.itemId || !integer(slot.cantidad, body.quantity, 64)) fail('SLOT_CHANGED', 'El slot guardado ya no contiene esa cantidad.');
        slot.cantidad -= body.quantity;
        if (!slot.cantidad) h[body.inventory][body.slotIndex] = {};
        // Descartar el cebo equipado solo cuando no quedan unidades en ninguno.
        if (h.cebo_equipado === body.itemId && ![...h.inventario_mochila, ...h.inventario_almacen].some(s => s.id === body.itemId)) h.cebo_equipado = '';
        delta = Math.floor(item.price * 0.25) * body.quantity;
    } else {
        const costs = catalog.upgrades[body.secondaryId];
        if (!h.secundarios_obtenidos.includes(body.secondaryId) || h.niveles_secundarios[body.secondaryId] !== body.expectedLevel) fail('LEVEL_CHANGED', 'El nivel o propietario del secundario cambio.');
        if (body.expectedLevel >= costs.length) fail('LEVEL_LIMIT', 'El secundario ya alcanzo el nivel maximo.');
        h.niveles_secundarios[body.secondaryId]++;
        delta = -costs[body.expectedLevel];
    }
    if (!Number.isSafeInteger(delta) || Math.abs(delta) > 2147483647) fail('BALANCE_LIMIT', 'Importe fuera de rango.');
    validateState(state);
    return { state, delta, total: Math.abs(delta) };
}
const features = Object.freeze({ commerce: true, commerceCatalogVersion: 1, commerceCatalogHash: catalogHash });
module.exports = { catalog, catalogHash, features, DECLINES, validateRequest, applyCommerce };
