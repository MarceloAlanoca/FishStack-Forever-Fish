const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { listUsers, selectUser, saveUser, deleteUser } = require("../controllers/adminUsers");

const router = express.Router();
router.use(isAuth, isAdmin);

router.param("id", (req, res, next, id) => {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return res.status(400).json({ message: "El ID de usuario no es válido." });
    }
    next();
});

router.get("/", listUsers);
router.get("/:id", selectUser);
router.post("/", saveUser);
router.put("/:id", saveUser);
router.delete("/:id", deleteUser);

module.exports = router;
