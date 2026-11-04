const router = require("express").Router();
const { isAuth } = require("../middlewares/auth");
const { createMissionLimit } = require("../middlewares/missionLimit");
const controller = require("../controllers/missions");

router.use(isAuth);
router.get("/", controller.overview);
router.post("/submit", createMissionLimit(), controller.submit);
router.post("/claim", controller.claim);
module.exports = router;
