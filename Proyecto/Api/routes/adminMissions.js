const router = require("express").Router();
const { isAuth, isAdmin } = require("../middlewares/auth");
const controller = require("../controllers/missions");

router.use(isAuth, isAdmin);
router.get("/", controller.list);
router.post("/", controller.save);
router.put("/:id", controller.save);
module.exports = router;
