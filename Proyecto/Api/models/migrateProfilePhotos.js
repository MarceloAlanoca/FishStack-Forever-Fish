const { Op } = require("sequelize");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const User = require("./userModel");
const { photosDirectory, photosUrl, removeProfilePhoto } = require("../middlewares/profilePhoto");

// Convertir las fotos anteriores sin perderlas ni recortar el contenido de la columna.
async function migrateProfilePhotos() {
    let lastId = 0;
    while (true) {
        const users = await User.findAll({
            attributes: ["ID_Usuario", "Foto_Perfil"],
            where: { ID_Usuario: { [Op.gt]: lastId }, Foto_Perfil: { [Op.like]: "data:image/%" } },
            order: [["ID_Usuario", "ASC"]],
            limit: 100
        });
        if (!users.length) break;
        for (const user of users) {
            lastId = user.ID_Usuario;
            const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(user.Foto_Perfil);
            if (!match) {
                console.warn(`La foto del usuario ${lastId} no se pudo convertir; se conserva el valor anterior.`);
                continue;
            }
            const extension = match[1] === "jpeg" ? "jpg" : match[1];
            const filename = `${randomUUID()}.${extension}`;
            const photo = photosUrl + filename;
            await writeFile(path.join(photosDirectory, filename), Buffer.from(match[2], "base64"), { flag: "wx" });
            try {
                await user.update({ Foto_Perfil: photo });
            } catch (error) {
                await removeProfilePhoto(photo);
                throw error;
            }
        }
    }
}

module.exports = { migrateProfilePhotos };
