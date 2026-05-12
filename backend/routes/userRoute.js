const Express = require("express");
const router = Express.Router();
const {
  getUser,
  updateUser,
  deleteUser,
  getUserTeams,
} = require("../controllers/userController");

// User profile management
router.get("/profile", getUser);
router.put("/profile", updateUser);
router.delete("/profile", deleteUser);

// User teams management
router.get("/teams", getUserTeams);

module.exports = router;
