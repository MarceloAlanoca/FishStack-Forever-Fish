const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const path = require("node:path");
const { readFile, readdir } = require("node:fs/promises");

const User = require("../models/userModel");
const { uploadProfilePhoto, photosDirectory, removeProfilePhoto } = require("../middlewares/profilePhoto");
const { updateProfilePhoto, deleteProfilePhoto } = require("../controllers/user");
const { migrateProfilePhotos } = require("../models/migrateProfilePhotos");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=", "base64");

test("subida, lectura, reemplazo, borrado y migración de fotos", async (t) => {
    const originalFindByPk = User.findByPk;
    const originalFindAll = User.findAll;
    let missing = false;
    let failUpdate = false;
    const user = {
        ID_Usuario: 1, Foto_Perfil: null,
        async update(values) {
            if (failUpdate) throw new Error("Fallo de base de datos simulado");
            Object.assign(this, values);
        }
    };
    User.findByPk = async () => missing ? null : user;
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { req.user = { id: 1 }; next(); });
    app.use(express.static(path.join(__dirname, "../public")));
    app.patch("/me/photo", uploadProfilePhoto, updateProfilePhoto);
    app.delete("/me/photo", deleteProfilePhoto);
    const server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const created = new Set();
    t.after(async () => {
        User.findByPk = originalFindByPk;
        User.findAll = originalFindAll;
        for (const photo of created) await removeProfilePhoto(photo);
        await new Promise(resolve => server.close(resolve));
    });
    async function upload(bytes = png, type = "image/png", field = "Foto_Perfil") {
        const form = new FormData();
        form.append(field, new Blob([bytes], { type }), "foto.png");
        return fetch(`${base}/me/photo`, { method: "PATCH", body: form });
    }

    await t.test("guarda solamente la ruta y sirve los bytes originales", async () => {
        const response = await upload();
        assert.equal(response.status, 200, await response.clone().text());
        const { Foto_Perfil: photo } = await response.json();
        created.add(photo);
        assert.match(photo, /^\/images\/users\/[a-f0-9-]+\.png$/);
        assert.deepEqual(await readFile(path.join(photosDirectory, path.basename(photo))), png);
        const image = await fetch(base + photo);
        assert.equal(image.status, 200);
        assert.match(image.headers.get("content-type"), /image\/png/);
        assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
    });

    await t.test("reemplaza y elimina el archivo anterior", async () => {
        const previous = user.Foto_Perfil;
        assert.equal((await upload()).status, 200);
        created.add(user.Foto_Perfil);
        assert.notEqual(user.Foto_Perfil, previous);
        assert.equal((await fetch(base + previous)).status, 404);
    });

    await t.test("rechaza JSON/Base64, campos incorrectos, tipos no admitidos y más de 5 MB", async () => {
        const previous = user.Foto_Perfil;
        const files = await readdir(photosDirectory);
        assert.equal((await fetch(`${base}/me/photo`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Foto_Perfil: `data:image/png;base64,${png.toString("base64")}` })
        })).status, 400);
        assert.equal((await upload(png, "image/png", "otroCampo")).status, 400);
        assert.equal((await upload("texto", "text/plain")).status, 400);
        assert.equal((await upload(Buffer.alloc(5 * 1024 * 1024 + 1))).status, 400);
        assert.equal(user.Foto_Perfil, previous);
        assert.deepEqual(await readdir(photosDirectory), files);
    });

    await t.test("limpia la subida si el usuario no existe o falla la base de datos", async () => {
        const files = await readdir(photosDirectory);
        missing = true;
        assert.equal((await upload()).status, 404);
        missing = false;
        failUpdate = true;
        assert.equal((await upload()).status, 500);
        failUpdate = false;
        assert.deepEqual(await readdir(photosDirectory), files);
    });

    await t.test("quitar foto elimina la ruta y el archivo", async () => {
        const previous = user.Foto_Perfil;
        assert.equal((await fetch(`${base}/me/photo`, { method: "DELETE" })).status, 200);
        assert.equal(user.Foto_Perfil, null);
        assert.equal((await fetch(base + previous)).status, 404);
    });

    await t.test("convierte Base64 existente y conserva la imagen", async () => {
        user.Foto_Perfil = `data:image/png;base64,${png.toString("base64")}`;
        let calls = 0;
        User.findAll = async () => calls++ === 0 ? [user] : [];
        await migrateProfilePhotos();
        created.add(user.Foto_Perfil);
        assert.match(user.Foto_Perfil, /^\/images\/users\//);
        assert.deepEqual(await readFile(path.join(photosDirectory, path.basename(user.Foto_Perfil))), png);
        User.findAll = async () => [];
        const previous = user.Foto_Perfil;
        await migrateProfilePhotos();
        assert.equal(user.Foto_Perfil, previous);
    });
});
