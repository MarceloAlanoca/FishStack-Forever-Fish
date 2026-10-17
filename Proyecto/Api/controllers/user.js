const User = require("../models/userModel");
const { register: registerUser, login } = require("./authController");
const { removeProfilePhoto, photosUrl } = require("../middlewares/profilePhoto");

// excluye la contrasena de los datos que se envian al cliente.
const publicAttributes = { exclude: ["Contraseña"] };

const getUsers = async (req, res) => {
    const users = await User.findAll({ attributes: publicAttributes });
    res.json(users);
};

const getUserById = async (req, res) => {
    const user = await User.findByPk(req.params.id, { attributes: publicAttributes });
    if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
};

const me = async (req, res) => {
    const user = await User.findByPk(req.user.id, { attributes: publicAttributes });
    res.json(user);
};

const updateProfilePhoto = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Selecciona una foto PNG, JPG o WebP válida." });
    }

    // guarda la ruta publica, el archivo ya fue escrito en disco por multer.
    const photo = photosUrl + req.file.filename;
    let saved = false;

    try {
        const user = req.account;
        const previousPhoto = user.Foto_Perfil;

        await user.update({ Foto_Perfil: photo });
        saved = true;
        // elimina la foto anterior despues de guardar la nueva ruta en la base de datos.
        await removeProfilePhoto(previousPhoto);
        res.json(await User.findByPk(req.user.id, { attributes: publicAttributes }));
    } catch (error) {
        // borra la subida solo si no se guardo su ruta, para no dejar archivos sin usuario.
        if (!saved) await removeProfilePhoto(photo);
        console.error("No se pudo guardar la foto", error);
        res.status(500).json({ message: "No se pudo guardar la foto. Inténtalo de nuevo." });
    }
};

const deleteProfilePhoto = async (req, res) => {
    try {
        const user = req.account;
        const previousPhoto = user.Foto_Perfil;
        await user.update({ Foto_Perfil: null });
        await removeProfilePhoto(previousPhoto);
        res.json(await User.findByPk(req.user.id, { attributes: publicAttributes }));
    } catch (error) {
        console.error("No se pudo eliminar la foto", error);
        res.status(500).json({ message: "No se pudo eliminar la foto. Inténtalo de nuevo." });
    }
};

module.exports = { getUsers, getUserById, me, updateProfilePhoto, deleteProfilePhoto, registerUser, login };
