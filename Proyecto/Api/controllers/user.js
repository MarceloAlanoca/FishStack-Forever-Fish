const User = require("../models/userModel");
const { register: registerUser, login } = require("./authController");

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
    if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
};

const updateProfilePhoto = async (req, res) => {
    const photo = req.body?.Foto_Perfil;
    if (photo !== null && (typeof photo !== "string" || photo.length > 700000 ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))) {
        return res.status(400).json({ message: "Selecciona una foto PNG, JPG o WebP válida." });
    }
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        await user.update({ Foto_Perfil: photo });
        res.json(await User.findByPk(req.user.id, { attributes: publicAttributes }));
    } catch (error) {
        console.error("No se pudo guardar la foto", error);
        res.status(500).json({ message: "No se pudo guardar la foto. Inténtalo de nuevo." });
    }
};

module.exports = { getUsers, getUserById, me, updateProfilePhoto, registerUser, login };
