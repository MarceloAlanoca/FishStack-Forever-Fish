const multer = require("multer");
const path = require("node:path");
const { mkdirSync } = require("node:fs");
const { writeFile, unlink } = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const imagesDirectory = path.join(__dirname, "../public/images/updates");
const imagesUrl = "/images/updates/";
const extensions = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };
mkdirSync(imagesDirectory, { recursive: true });

const receiveImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10, fieldSize: 65000, parts: 11 },
    fileFilter: (req, file, callback) => {
        if (!extensions[file.mimetype]) {
            return callback(new Error("Elige una imagen PNG, JPG o WebP."));
        }
        callback(null, true);
    }
}).single("Imagen");

function uploadUpdateImage(req, res, next) {
    receiveImage(req, res, (error) => {
        if (error) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "La imagen debe pesar como máximo 5 MB."
                : "Revisa el formulario y envía una sola imagen PNG, JPG o WebP de hasta 5 MB.";
            return res.status(400).json({ message });
        }
        if (req.file) {
            const bytes = req.file.buffer;
            const type = req.file.mimetype;
            const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
            const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
            const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
            if (!(type === "image/png" && png || type === "image/jpeg" && jpg || type === "image/webp" && webp)) {
                return res.status(400).json({ message: "El archivo no corresponde a una imagen PNG, JPG o WebP válida." });
            }
        }
        next();
    });
}

async function saveUpdateImage(file) {
    const filename = randomUUID() + extensions[file.mimetype];
    await writeFile(path.join(imagesDirectory, filename), file.buffer, { flag: "wx" });
    return imagesUrl + filename;
}

async function removeUpdateImage(image) {
    // Solo elimina imágenes generadas por este servidor dentro de la carpeta de updates.
    if (typeof image !== "string" || !/^\/images\/updates\/[a-f0-9-]+\.(png|jpg|webp)$/.test(image)) return;
    try {
        await unlink(path.join(imagesDirectory, path.basename(image)));
    } catch (error) {
        if (error.code !== "ENOENT") console.error("No se pudo eliminar una imagen de actualización", error);
    }
}

module.exports = { uploadUpdateImage, saveUpdateImage, removeUpdateImage };
