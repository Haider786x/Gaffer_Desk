const Express = require("express");
const router = Express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");

// Team CRUD operations
router.post("/", authMiddleware, createTeam); // User creates a new team (protected)
router.get("/", getTeams); // Get all teams (public)
router.get("/:id", getTeamById); // Get specific team (public)
router.put("/:id", authMiddleware, updateTeam); // Update team (protected)
router.delete("/:id", authMiddleware, deleteTeam); // Delete team (protected)

module.exports = router;
