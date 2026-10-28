const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { creditSection, listCredits, getCredit, saveCredit, deleteCredit } = require("../controllers/adminCredits");

const router = express.Router();
router.use(isAuth, isAdmin);
router.param("tipo", creditSection);
router.param("id", (req, res, next, id) => {
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) {
        return res.status(400).json({ message: "El ID del credito no es valido." });
    }
    next();
});
router.get("/:tipo", listCredits);
router.get("/:tipo/:id", getCredit);
router.post("/:tipo", saveCredit);
router.put("/:tipo/:id", saveCredit);
router.delete("/:tipo/:id", deleteCredit);

module.exports = router;
