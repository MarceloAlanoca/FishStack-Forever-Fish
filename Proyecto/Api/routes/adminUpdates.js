const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { uploadUpdateImage } = require("../middlewares/updateImage");
const { getUpdates, getUpdatesByID, saveUpdate, deleteUpdate } = require("../controllers/UpdateController");

const router = express.Router();
router.use(isAuth, isAdmin);

router.param("id", (req, res, next, id) => {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return res.status(400).json({ message: "El ID de actualización no es válido." });
    }
    next();
});

router.get("/", getUpdates);
router.get("/:id", getUpdatesByID);
router.post("/", uploadUpdateImage, saveUpdate);
router.put("/:id", uploadUpdateImage, saveUpdate);
router.delete("/:id", deleteUpdate);

module.exports = router;
