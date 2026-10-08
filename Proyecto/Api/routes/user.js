const express = require("express");

const router = express.Router();

const {
    register,
    login
} = require("../controllers/authController");

const {
    isAuth
} = require("../middlewares/auth");


router.post("/register", register);

router.post("/login", login);


router.get("/perfil", isAuth, (req, res) => {

    res.status(200).json({
        message: "Usuario autenticado correctamente",
        usuario: req.user
    });

});


module.exports = router;