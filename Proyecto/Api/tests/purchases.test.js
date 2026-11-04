const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { sequelize } = require("../config/db");
const User = require("../models/userModel");
const { Article } = require("../models/articlesModel");
const { SimulatedPurchase } = require("../models/simulatedPurchaseModel");
const { simulatePurchase } = require("../controllers/purchases");

// Dobles de persistencia: prueban el controlador sin tocar las cuentas del proyecto.
test("compra simulada: validaciones, saldo y reintentos", async t => {
    const user = { ID_Usuario: 1, isActive: true, authVersion: 0, Doblones: 0,
        async update(data) { Object.assign(this, data); } };
    const records = new Map();
    mock.method(sequelize, "transaction", async callback => {
        const balance = user.Doblones;
        const saved = new Map(records);
        try { return await callback({ LOCK: { UPDATE: "UPDATE" } }); }
        catch (error) { user.Doblones = balance; records.clear(); saved.forEach((v, k) => records.set(k, v)); throw error; }
    });
    mock.method(User, "findByPk", async () => user);
    const article = { ID_Pass: 1, Precio: 5000, Doblones: 200 };
    mock.method(Article, "findByPk", async id => id === 1 ? article : null);
    mock.method(SimulatedPurchase, "findByPk", async id => records.get(id));
    const create = mock.method(SimulatedPurchase, "create", async data => { records.set(data.id, data); return data; });
    const body = () => ({ requestId: randomUUID(), articleId: 1, expectedPrice: 5000, expectedCoins: 200, outcome: "approved" });
    async function call(data) {
        const response = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
        await simulatePurchase({ body: data, user: { id: 1 }, account: { authVersion: 0 } }, response);
        return response;
    }
    await t.test("acredita una sola vez al repetir la referencia", async () => {
        const request = body();
        assert.equal((await call(request)).data.balance, 200);
        assert.equal((await call(request)).data.balance, 200);
        assert.equal(records.size, 1);
    });
    await t.test("rechazo de prueba no modifica el saldo", async () => {
        const result = await call({ ...body(), outcome: "declined" });
        assert.equal(result.data.status, "declined");
        assert.equal(result.data.coins, 0);
        assert.equal(user.Doblones, 200);
    });
    await t.test("no acepta tarjetas ni campos adicionales", async () => {
        assert.equal((await call({ ...body(), card: "4242424242424242" })).code, 400);
    });
    await t.test("valida referencia, artículo y resultado", async () => {
        assert.equal((await call({ ...body(), requestId: "bad" })).code, 400);
        assert.equal((await call({ ...body(), articleId: "1" })).code, 400);
        assert.equal((await call({ ...body(), outcome: "paid" })).code, 400);
        assert.equal((await call({ ...body(), articleId: 99 })).code, 404);
    });
    await t.test("rechaza precios manipulados o paquetes modificados", async () => {
        assert.equal((await call({ ...body(), expectedPrice: 1 })).code, 409);
        assert.equal((await call({ ...body(), expectedCoins: 9999 })).code, 409);
        assert.equal(user.Doblones, 200);
    });
    await t.test("impide reutilizar la referencia con otro resultado o cuenta", async () => {
        const request = body();
        await call(request);
        assert.equal((await call({ ...request, outcome: "declined" })).code, 409);
        user.ID_Usuario = 2;
        assert.equal((await call(request)).code, 409);
        user.ID_Usuario = 1;
    });
    await t.test("cuenta desactivada y límite de saldo", async () => {
        user.isActive = false;
        assert.equal((await call(body())).code, 401);
        user.isActive = true;
        user.Doblones = 2147483647;
        assert.equal((await call(body())).code, 409);
        user.Doblones = 400;
    });
    await t.test("fallo de persistencia revierte la operación", async () => {
        const before = records.size;
        create.mock.mockImplementationOnce(async () => { throw new Error("database unavailable"); });
        assert.equal((await call(body())).code, 500);
        assert.equal(user.Doblones, 400);
        assert.equal(records.size, before);
    });
    mock.restoreAll();
});
