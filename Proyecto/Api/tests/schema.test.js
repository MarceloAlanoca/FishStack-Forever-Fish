const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { sequelize } = require("../config/db");
const { ensureSchema } = require("../config/schema");

test("migración aditiva compatible con SQL original y repetible", async () => {
    const query = sequelize.getQueryInterface();
    const columns = {};
    const indexes = [];
    const additions = [];
    mock.method(query, "describeTable", async () => columns);
    mock.method(query, "showIndex", async () => indexes);
    mock.method(query, "addColumn", async (table, name) => { additions.push(name); columns[name] = {}; });
    mock.method(query, "addIndex", async (table, fields) => {
        additions.push(fields[0]);
        indexes.push({ unique: true, fields: fields.map(attribute => ({ attribute })) });
    });
    await ensureSchema();
    await ensureSchema();
    assert.deepEqual(additions, ["Foto_Perfil", "Usuario"]);
    mock.restoreAll();
});
