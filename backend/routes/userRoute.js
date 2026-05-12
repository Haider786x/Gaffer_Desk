const Express = require("express");
const router = Express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUser,
  updateUser,
  deleteUser,
  getUserTeams,
} = require("../controllers/userController");

// User profile management (protected routes)
router.get("/profile", authMiddleware, getUser);
router.put("/profile", authMiddleware, updateUser);
router.delete("/profile", authMiddleware, deleteUser);

// User teams management (protected route)
router.get("/teams", authMiddleware, getUserTeams);

module.exports = router;
