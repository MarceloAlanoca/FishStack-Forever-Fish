const express = require("express");
const { isAuth, isAdmin } = require("../middlewares/auth");
const { getArticles, getArticle, saveArticle, deleteArticle } = require("../controllers/articles");

const router = express.Router();
router.use(isAuth, isAdmin);

router.param("id", (req, res, next, id) => {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return res.status(400).json({ message: "El ID del artículo no es válido." });
    }
    next();
});

router.get("/", getArticles);
router.get("/:id", getArticle);
router.post("/", saveArticle);
router.put("/:id", saveArticle);
router.delete("/:id", deleteArticle);

module.exports = router;
