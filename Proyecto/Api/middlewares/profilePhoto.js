const multer = require("multer");
const path = require("node:path");
const { mkdirSync } = require("node:fs");
const { unlink } = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const photosDirectory = path.join(__dirname, "../public/images/users");
const photosUrl = "/images/users/";
const extensions = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };
mkdirSync(photosDirectory, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: photosDirectory,
        filename: (req, file, callback) => callback(null, randomUUID() + extensions[file.mimetype])
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
    fileFilter: (req, file, callback) => {
        if (!Object.hasOwn(extensions, file.mimetype)) {
            const error = new Error("Elige una imagen JPG, PNG o WebP.");
            error.status = 400;
            return callback(error);
        }
        callback(null, true);
    }
}).single("Foto_Perfil");

const uploadProfilePhoto = (req, res, next) => {
    upload(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError || error.status === 400) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "La imagen debe pesar como máximo 5 MB."
                : "Envía una sola imagen JPG, PNG o WebP en el campo Foto_Perfil.";
            return res.status(400).json({ message });
        }
        console.error("No se pudo recibir la foto", error);
        res.status(500).json({ message: "No se pudo guardar la foto. Inténtalo de nuevo." });
    });
};

// Solo borrar archivos generados por la aplicación dentro de la carpeta de fotos.
async function removeProfilePhoto(photo) {
    if (typeof photo !== "string" || !/^\/images\/users\/[a-f0-9-]+\.(png|jpg|webp)$/.test(photo)) return;
    try {
        await unlink(path.join(photosDirectory, path.basename(photo)));
    } catch (error) {
        if (error.code !== "ENOENT") console.error("No se pudo eliminar una foto anterior", error);
    }
}

module.exports = { uploadProfilePhoto, removeProfilePhoto, photosDirectory, photosUrl };
