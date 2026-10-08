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

module.exports = { getUsers, getUserById, me, registerUser, login };
