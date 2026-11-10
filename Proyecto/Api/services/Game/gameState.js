const { createHash } = require('node:crypto');
const template = require('../../data/Game/defaultGameState.json');
const { AccountError } = require('./accountErrors');
const worlds = ['mar_aratel', 'aguas_corales', 'paramos_deserticos', 'tirania_infernal', 'cumbre_desolada'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = value => Number.isSafeInteger(value) && value >= 0 && value <= 2147483647;
const id = value => typeof value === 'string' && value.length <= 80 && /^[\p{L}\d_-]+$/u.test(value);
const ids = value => Array.isArray(value) && value.length <= 200 && value.every(id);

function invalid(path) { throw new AccountError(400, 'VALIDATION_FAILED', `El campo ${path} no es válido.`); }
function keys(value, expected, path) {
    if (!object(value) || Object.keys(value).length !== expected.length || expected.some(key => !Object.hasOwn(value, key))) invalid(path);
}
function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
    return JSON.stringify(value);
}
const saveHash = (revision, state) => createHash('sha256').update(canonical({ revision, state })).digest('hex');
const initialState = () => structuredClone(template);

function validateState(state) {
    if (Buffer.byteLength(JSON.stringify(state) || '') > 256 * 1024) {
        throw new AccountError(413, 'STATE_TOO_LARGE', 'La partida supera el tamaño máximo de guardado.');
    }
    function inspect(value, depth = 0) {
        if (depth > 8) invalid('profundidad');
        if (Array.isArray(value) && value.length > 200) invalid('lista');
        if (object(value) && Object.keys(value).length > 200) invalid('diccionario');
        if (value && typeof value === 'object') {
            for (const [key, child] of Object.entries(value)) {
                if (['__proto__', 'constructor', 'prototype', 'doblones', 'wallet', 'balance'].includes(key.toLowerCase())) invalid(key);
                inspect(child, depth + 1);
            }
        } else if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > 2147483647)) invalid('número');
        else if (typeof value === 'string' && (value.length > 256 || /[\u0000-\u001f]/.test(value))) invalid('texto');
    }
    inspect(state);
    keys(state, ['schemaVersion', 'historia', 'forever', 'runCheckpoint'], 'partida');
    if (state.schemaVersion !== 1 || state.historia?.version_save !== 14) {
        throw new AccountError(400, 'UNSUPPORTED_SCHEMA', 'Esta versión de partida todavía no es compatible.');
    }
    if (state.runCheckpoint !== null) invalid('runCheckpoint');
    for (const section of ['historia', 'forever']) {
        keys(state[section], Object.keys(template[section]), section);
        for (const [key, example] of Object.entries(template[section])) {
            const value = state[section][key];
            if (Array.isArray(example) ? !Array.isArray(value) : object(example) ? !object(value) : typeof value !== typeof example) invalid(`${section}.${key}`);
            if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) invalid(key);
        }
    }
    const h = state.historia;
    const f = state.forever;
    for (const [key, size] of Object.entries({ inventario_mochila: 8, inventario_almacen: 48, bodega_barco: 100 })) {
        if (h[key].length !== size) invalid(key);
        for (const slot of h[key]) {
            if (!object(slot)) invalid(key);
            if (!Object.keys(slot).length) continue;
            if (key !== 'bodega_barco') {
                keys(slot, ['id', 'cantidad'], key);
                if (!id(slot.id) || !Number.isInteger(slot.cantidad) || slot.cantidad < 1 || slot.cantidad > 64) invalid(key);
            } else {
                const allowed = ['nombre', 'calidad', 'peso', 'precio', 'icono_path', 'speciesId', 'captureId'];
                if (Object.keys(slot).some(field => !allowed.includes(field)) || typeof slot.nombre !== 'string' || !slot.nombre.trim() ||
                    typeof slot.calidad !== 'string' || typeof slot.peso !== 'number' || slot.peso <= 0 ||
                    typeof slot.precio !== 'number' || slot.precio < 0 || typeof slot.icono_path !== 'string') invalid(key);
                if (!slot.icono_path.startsWith('res://Assets/') || slot.icono_path.includes('..')) invalid('icono_path');
                for (const field of ['speciesId', 'captureId']) if (slot[field] !== undefined && !id(slot[field])) invalid(field);
            }
        }
    }
    for (const field of ['cañas_obtenidas', 'amuletos_obtenidos', 'barcos_obtenidos', 'skines_obtenidos', 'secundarios_obtenidos']) {
        if (!ids(h[field]) || new Set(h[field]).size !== h[field].length) invalid(field);
    }
    if (![3, 4, 5, 6].includes(h.slots_amuletos_desbloqueados) || h.amuletos_equipados.length !== h.slots_amuletos_desbloqueados ||
        h.amuletos_equipados.some(value => value !== '' && !h.amuletos_obtenidos.includes(value))) invalid('amuletos_equipados');
    for (const [field, owned] of [['cana_equipada', 'cañas_obtenidas'], ['barco_equipado', 'barcos_obtenidos'],
        ['secundario_equipado', 'secundarios_obtenidos'], ['skin_equipada', 'skines_obtenidos']]) {
        if (h[field] && !h[owned].includes(h[field])) invalid(field);
    }
    keys(h.skines_equipadas, ['george', 'hannah', 'percy', 'robo_stack'], 'skines_equipadas');
    if (Object.values(h.skines_equipadas).some(value => value !== '' && !h.skines_obtenidos.includes(value))) invalid('skines_equipadas');
    keys(h.niveles_secundarios, ['percy', 'robo_stack'], 'niveles_secundarios');
    if (Object.values(h.niveles_secundarios).some(value => !Number.isInteger(value) || value < 0 || value > 5)) invalid('niveles_secundarios');
    if (Object.values(h.npcs_conversados).some(value => typeof value !== 'boolean')) invalid('npcs_conversados');
    if (!worlds.includes(h.mundo_historia_actual)) invalid('mundo_historia_actual');
    keys(h.peces_pescados_por_mundo, worlds, 'peces_pescados_por_mundo');
    keys(h.items_adquiridos_por_mundo, worlds, 'items_adquiridos_por_mundo');
    if (!Object.values(h.peces_pescados_por_mundo).every(integer) || !Object.values(h.items_adquiridos_por_mundo).every(ids)) invalid('progreso_mundos');
    keys(h.posicion_reingreso, ['x', 'y'], 'posicion_reingreso');
    if (Object.values(h.posicion_reingreso).some(value => typeof value !== 'number' || !Number.isFinite(value))) invalid('posicion_reingreso');
    if (h.volumen > 1 || f.volumen_musica > 1 || f.escala_iconos_seleccion < .25 || f.escala_iconos_seleccion > 5 ||
        f.escala_texto_seleccion < .25 || f.escala_texto_seleccion > 5) invalid('preferencias');
    for (const field of ['esencia', 'mejor_nivel_alcanzado', 'runs_completadas']) if (!integer(f[field])) invalid(field);
    if (!Object.values(f.muertes_por_enemigo).every(integer)) invalid('muertes_por_enemigo');
    keys(f.compras_tienda_forever, Object.keys(template.forever.compras_tienda_forever), 'compras_tienda_forever');
    if (Object.values(f.compras_tienda_forever).some(value => typeof value !== 'boolean')) invalid('compras_tienda_forever');
    if (!['', 'george', 'hannah'].includes(h.personaje_seleccionado) || !['george', 'hannah'].includes(f.personaje_seleccionado)) invalid('personaje_seleccionado');
    return state;
}

module.exports = { initialState, validateState, saveHash };
