const Express = require("express");
const router = Express.Router();
const {
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/playerController");
router.get("/profile", getUser);
router.post("/profile", updateUser);
router.delete("/profile", deleteUser);
module.exports = router;
