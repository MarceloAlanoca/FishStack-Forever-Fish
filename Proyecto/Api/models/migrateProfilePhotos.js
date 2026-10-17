const { Op } = require("sequelize");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const User = require("./userModel");
const { photosDirectory, photosUrl, removeProfilePhoto } = require("../middlewares/profilePhoto");

// convierte las fotos antiguas guardadas como texto, sin perder las imagenes.
async function migrateProfilePhotos() {
    let lastId = 0;
    while (true) {
        // busca de a 100 usuarios con fotos antiguas, continuando despues del ultimo id revisado.
        const users = await User.findAll({
            attributes: ["ID_Usuario", "Foto_Perfil"],
            where: { ID_Usuario: { [Op.gt]: lastId }, Foto_Perfil: { [Op.like]: "data:image/%" } },
            order: [["ID_Usuario", "ASC"]],
            limit: 100
        });
        if (!users.length) break;
        for (const user of users) {
            lastId = user.ID_Usuario;
            // separa el formato de imagen y su contenido base64, en match[1] y match[2].
            const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(user.Foto_Perfil);
            if (!match) {
                console.warn(`La foto del usuario ${lastId} no se pudo convertir; se conserva el valor anterior.`);
                continue;
            }
            const extension = match[1] === "jpeg" ? "jpg" : match[1];
            const filename = `${randomUUID()}.${extension}`;
            const photo = photosUrl + filename;
            // convierte el texto a bytes, wx evita sobrescribir un archivo que ya exista.
            await writeFile(path.join(photosDirectory, filename), Buffer.from(match[2], "base64"), { flag: "wx" });
            try {
                await user.update({ Foto_Perfil: photo });
            } catch (error) {
                // si falla el guardado de la ruta, borra el archivo nuevo y conserva el dato anterior.
                await removeProfilePhoto(photo);
                throw error;
            }
        }
    }
}

module.exports = { migrateProfilePhotos };
