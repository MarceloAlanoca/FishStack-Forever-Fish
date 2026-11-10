// Regenerar con: node scripts/Game/syncFishCatalog.js RUTA_AL_PROYECTO_GODOT
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
if (!root) throw new Error('Indica la carpeta del proyecto Godot.');
const worlds = { 'Mar Aratel': 'mar_aratel', 'Aguas Corales': 'aguas_corales',
    'Paramos Deserticos': 'paramos_deserticos', 'Tirania Infernal': 'tirania_infernal', 'Cumbre Desolada': 'cumbre_desolada' };
const fields = ['nombre', 'calidad', 'valor', 'peso_minimo', 'peso_maximo'];
function properties(text, script = false) {
    const result = {};
    for (const key of fields) {
        const regex = script ? new RegExp(`(?:@export[^\\n]* )?var ${key}(?::[^=\\n]+)?\\s*[:]?=\\s*("[^"\\n]*"|[\\d.]+)`)
            : new RegExp(`^${key} = ("[^"\\n]*"|[\\d.]+)`, 'm');
        const match = text.match(regex);
        if (match) result[key] = JSON.parse(match[1]);
    }
    return result;
}
function scriptProperties(resource) {
    const text = fs.readFileSync(path.join(root, resource.replace('res://', '')), 'utf8');
    const parent = text.match(/^extends "(res:\/\/[^"\n]+)"/m);
    return { ...(parent ? scriptProperties(parent[1]) : {}), ...properties(text, true) };
}
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const species = {};
for (const [world, worldId] of Object.entries(worlds)) {
    const dir = path.join(root, 'Assets/Contenido Del Juego/Mundos', world, 'Peces');
    if (!fs.existsSync(dir)) continue; // Mundos que aun no tienen catalogo propio.
    for (const file of files(dir).filter(f => f.endsWith('.tscn'))) {
        const text = fs.readFileSync(file, 'utf8');
        const script = text.match(/\[ext_resource type="Script"[^\n]*path="([^"]+)"/);
        if (!script) continue;
        const props = { ...scriptProperties(script[1]), ...properties(text) };
        if (fields.some(key => props[key] === undefined)) throw new Error('Datos incompletos: ' + file);
        const speciesId = worldId + '_' + path.basename(file, '.tscn').toLowerCase();
        if (species[speciesId]) throw new Error('Especie duplicada: ' + speciesId);
        species[speciesId] = { name: props.nombre, quality: props.calidad, basePrice: props.valor,
            minWeight: props.peso_minimo, maxWeight: props.peso_maximo,
            scene: 'res://' + path.relative(root, file).split(path.sep).join('/'),
            icons: [...text.matchAll(/\[ext_resource type="Texture2D"[^\n]*path="([^"]+)"/g)].map(m => m[1]) };
    }
}
const out = path.resolve(__dirname, '../../data/Game/fishCatalog.json');
fs.writeFileSync(out, JSON.stringify({ version: 1, species }, null, 2) + '\n');
console.log('Catalogo generado: ' + Object.keys(species).length + ' especies.');
