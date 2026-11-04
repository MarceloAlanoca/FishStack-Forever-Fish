const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/db");
const User = require("../models/userModel");
const { Mission, DailyMission, MissionProgress } = require("../models/missionModel");
const service = require("../services/missions");
const controller = require("../controllers/missions");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { createMissionLimit } = require("../middlewares/missionLimit");

const questions = () => Array.from({ length: 3 }, (_, i) => ({ text: `Pregunta ${i}`, options: ["A", "B", "C"], correct: i, explanation: "Explicación del puerto" }));
const definition = () => ({ title: "Misión de prueba", description: "Ayuda al puerto", reward: 150, active: true, questions: questions() });
function response() {
    return { code: 200, headers: {}, status(code) { this.code = code; return this; },
        json(data) { this.data = data; return this; }, set(key, value) { this.headers[key] = value; return this; } };
}

test("día del servidor y validación de misiones", () => {
    assert.equal(service.missionDay(new Date("2026-11-02T02:59:59Z")), "2026-11-01");
    assert.equal(service.missionDay(new Date("2026-11-02T03:00:00Z")), "2026-11-02");
    assert.equal(service.validateMission(definition()), "");
    for (const invalid of [{ reward: -1 }, { reward: 1.5 }, { reward: 1001 }, { title: " " }, { active: "true" }, { questions: [] }]) {
        assert.ok(service.validateMission({ ...definition(), ...invalid }));
    }
    const duplicate = definition();
    duplicate.questions[0].options = ["A", " a ", "C"];
    assert.ok(service.validateMission(duplicate));
    const sanitized = service.sanitizeMission({ ...definition(), userId: 8, title: "  Puerto  " });
    assert.equal(sanitized.title, "Puerto");
    assert.equal(sanitized.userId, undefined);
});

test("no filtra respuestas correctas antes de completar", () => {
    const daily = { ...definition(), day: "2026-11-02" };
    const publicData = service.publicMission(daily);
    assert.equal(publicData.questions[0].correct, undefined);
    assert.equal(publicData.questions[0].explanation, undefined);
    assert.equal(service.publicMission(daily, true).questions[0].correct, 0);
});

test("la copia diaria permanece fija aunque el administrador edite el banco", async t => {
    let snapshot;
    const entry = { id: 1, ...definition() };
    t.mock.method(Mission, "findAll", async () => [entry]);
    t.mock.method(DailyMission, "findByPk", async () => snapshot);
    const create = t.mock.method(DailyMission, "findOrCreate", async ({ defaults, where }) => {
        snapshot = structuredClone({ ...defaults, ...where });
        return [snapshot];
    });
    const first = await service.getDailyMission("2026-11-02");
    entry.reward = 999;
    entry.questions[0].correct = 2;
    const second = await service.getDailyMission("2026-11-02");
    assert.equal(first.reward, 150);
    assert.equal(second.questions[0].correct, 0);
    assert.equal(create.mock.callCount(), 1);
});

test("sin misiones activas no inventa una recompensa", async t => {
    t.mock.method(DailyMission, "findByPk", async () => null);
    t.mock.method(Mission, "findAll", async () => []);
    assert.equal(await service.getDailyMission("2026-11-03"), null);
});

test("las misiones iniciales son válidas y no reemplazan contenido existente", async t => {
    const { seedMissions } = require("../scripts/seedMissions");
    let count = 0;
    t.mock.method(Mission, "count", async () => count);
    const create = t.mock.method(Mission, "bulkCreate", async rows => {
        assert.equal(rows.length, 3);
        rows.forEach(row => assert.equal(service.validateMission(row), ""));
        count = rows.length;
    });
    await seedMissions();
    await seedMissions();
    assert.equal(create.mock.callCount(), 1);
});

test("administración valida y guarda solo los campos permitidos", async t => {
    const created = t.mock.method(Mission, "create", async values => ({ ...values, id: 4 }));
    const res = response();
    await controller.save({ body: { ...definition(), userId: 9 }, params: {} }, res);
    assert.equal(res.code, 201);
    assert.equal(res.data.id, 4);
    assert.equal(created.mock.calls[0].arguments[0].userId, undefined);
    const invalid = response();
    await controller.save({ body: { ...definition(), reward: 10001 }, params: {} }, invalid);
    assert.equal(invalid.code, 400);
    assert.equal(created.mock.callCount(), 1);
    t.mock.method(Mission, "findByPk", async () => null);
    const missing = response();
    await controller.save({ body: definition(), params: { id: "99" } }, missing);
    assert.equal(missing.code, 404);
});

test("el resumen consulta únicamente el historial del usuario autenticado", async t => {
    t.mock.method(DailyMission, "findByPk", async () => ({ ...definition(), day: service.missionDay() }));
    t.mock.method(MissionProgress, "findOne", async ({ where }) => { assert.equal(where.userId, 7); return null; });
    t.mock.method(MissionProgress, "findAll", async ({ where, limit }) => { assert.equal(where.userId, 7); assert.equal(limit, 10); return []; });
    t.mock.method(MissionProgress, "sum", async (field, { where }) => { assert.equal(where.userId, 7); return null; });
    t.mock.method(MissionProgress, "count", async ({ where }) => { assert.equal(where.userId, 7); return 0; });
    const res = response();
    await controller.overview({ user: { id: 7 } }, res);
    assert.equal(res.data.stats.earned, 0);
    assert.equal(res.data.mission.questions[0].correct, undefined);
});

test("middleware de intentos limita por usuario y se recupera al vencer", () => {
    let time = 1000;
    const limit = createMissionLimit({ now: () => time });
    let calls = 0;
    limit({ user: { id: 1 } }, response(), () => calls++);
    const blocked = response();
    limit({ user: { id: 1 } }, blocked, () => calls++);
    assert.equal(blocked.code, 429);
    assert.equal(blocked.headers["Retry-After"], "3");
    limit({ user: { id: 2 } }, response(), () => calls++);
    time = 4000;
    limit({ user: { id: 1 } }, response(), () => calls++);
    assert.equal(calls, 3);
});

test("autenticación JWT, cuenta activa y autorización administrativa", async t => {
    const user = { ID_Usuario: 1, Usuario: "tripulante", Rol: "Usuario", isActive: true, authVersion: 0 };
    t.mock.method(User, "findByPk", async () => user);
    let calls = 0;
    const noToken = response();
    await isAuth({ headers: {} }, noToken, () => calls++);
    assert.equal(noToken.code, 401);
    const invalid = response();
    await isAuth({ headers: { authorization: "Bearer inválido" } }, invalid, () => calls++);
    assert.equal(invalid.code, 403);
    const token = jwt.sign({ id: 1, version: 0 }, process.env.JWT_SECRET || "losOG", { expiresIn: "1h" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    await isAuth(req, response(), () => calls++);
    assert.equal(req.user.id, 1);
    const forbidden = response();
    isAdmin(req, forbidden, () => calls++);
    assert.equal(forbidden.code, 403);
    req.user.rol = "Administrador";
    isAdmin(req, response(), () => calls++);
    user.isActive = false;
    const inactive = response();
    await isAuth({ headers: req.headers }, inactive, () => calls++);
    assert.equal(inactive.code, 401);
    user.isActive = true;
    user.authVersion = 1;
    const revoked = response();
    await isAuth({ headers: req.headers }, revoked, () => calls++);
    assert.equal(revoked.code, 401);
    assert.equal(calls, 2);
});

test("misión: progreso, aislamiento de cuentas, reclamación única y rollback", async t => {
    const day = service.missionDay();
    const daily = { ...definition(), day };
    const users = new Map([1, 2].map(id => [id, { ID_Usuario: id, Doblones: 0, isActive: true, authVersion: 0,
        async update(values) { Object.assign(this, values); } }]));
    const records = new Map();
    const key = (id, day) => `${id}:${day}`;
    let queue = Promise.resolve();
    t.mock.method(sequelize, "transaction", callback => {
        // Doble transaccional con exclusión y rollback; el test no necesita un servidor MySQL.
        const result = queue.then(async () => {
            const balances = [...users].map(([id, user]) => [id, user.Doblones]);
            const saved = [...records].map(([id, record]) => [id, { ...record }]);
            try { return await callback({ LOCK: { UPDATE: "UPDATE" } }); }
            catch (error) {
                balances.forEach(([id, balance]) => { users.get(id).Doblones = balance; });
                records.clear(); saved.forEach(([id, record]) => records.set(id, record));
                throw error;
            }
        });
        queue = result.catch(() => {});
        return result;
    });
    const locks = [];
    t.mock.method(User, "findByPk", async (id, options) => { locks.push(options?.lock); return users.get(id); });
    t.mock.method(DailyMission, "findByPk", async () => daily);
    t.mock.method(MissionProgress, "findOne", async ({ where }) => records.get(key(where.userId, where.day)));
    t.mock.method(MissionProgress, "create", async values => {
        const record = { attempts: 0, bestScore: 0, completedAt: null, claimedAt: null, earnedCoins: 0, ...values,
            async update(data) { Object.assign(this, data); } };
        records.set(key(values.userId, values.day), record);
        return record;
    });
    async function call(action, body = {}, userId = 1) {
        const res = response();
        await controller[action]({ body: { day, ...body }, user: { id: userId }, account: { authVersion: 0 } }, res);
        return res;
    }
    await t.test("rechaza día manipulado, respuestas inválidas y saldo enviado desde cliente", async () => {
        assert.equal((await call("submit", { day: "1900-01-01", answers: [0, 1, 2] })).code, 409);
        assert.equal((await call("submit", { answers: [0, null, 2] })).code, 400);
        assert.equal((await call("claim", { reward: 10000 })).code, 400);
    });
    await t.test("no paga por una misión incompleta", async () => {
        assert.equal((await call("claim")).code, 409);
        assert.equal(users.get(1).Doblones, 0);
    });
    await t.test("un fallo conserva el mejor resultado sin revelar las respuestas", async () => {
        const result = await call("submit", { answers: [0, 0, 0] });
        assert.equal(result.data.score, 1);
        assert.equal(result.data.mission.questions[1].correct, undefined);
        await call("submit", { answers: [1, 0, 0] });
        assert.equal(records.get(key(1, day)).bestScore, 1);
        assert.equal(records.get(key(1, day)).attempts, 2);
    });
    await t.test("completar habilita el premio; otra cuenta no puede reclamarlo", async () => {
        const result = await call("submit", { answers: [0, 1, 2] });
        assert.ok(result.data.progress.completedAt);
        assert.equal(result.data.mission.questions[1].correct, 1);
        assert.equal((await call("claim", {}, 2)).code, 409);
    });
    await t.test("ocho solicitudes concurrentes acreditan una sola recompensa", async () => {
        const results = await Promise.all(Array.from({ length: 8 }, () => call("claim")));
        assert.equal(results.filter(result => !result.data.alreadyClaimed).length, 1);
        assert.equal(users.get(1).Doblones, 150);
        assert.equal(records.get(key(1, day)).earnedCoins, 150);
        assert.ok(locks.every(lock => lock === "UPDATE"));
    });
    await t.test("reentregar una misión completada no aumenta los intentos ni paga", async () => {
        const before = records.get(key(1, day)).attempts;
        await call("submit", { answers: [0, 1, 2] });
        assert.equal(records.get(key(1, day)).attempts, before);
        assert.equal(users.get(1).Doblones, 150);
    });
    await t.test("un fallo al guardar el premio revierte el saldo", async () => {
        await call("submit", { answers: [0, 1, 2] }, 2);
        const record = records.get(key(2, day));
        const update = record.update;
        record.update = async () => { throw new Error("fallo de persistencia"); };
        const result = await call("claim", {}, 2);
        assert.equal(result.code, 500);
        assert.equal(users.get(2).Doblones, 0);
        assert.equal(records.get(key(2, day)).claimedAt, null);
        records.get(key(2, day)).update = update;
    });
    await t.test("valida saldo máximo y sesión revocada antes de pagar", async () => {
        users.get(2).Doblones = 2147483647;
        assert.equal((await call("claim", {}, 2)).code, 409);
        users.get(2).authVersion = 1;
        assert.equal((await call("claim", {}, 2)).code, 401);
    });
});
