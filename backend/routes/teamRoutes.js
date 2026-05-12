const Express = require("express");
const router = Express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");

// Team CRUD operations
router.post("/", createTeam); // User creates a new team
router.get("/", getTeams); // Get all teams (or filter by user)
router.get("/:id", getTeamById); // Get specific team by ID
router.put("/:id", updateTeam); // Update team details
router.delete("/:id", deleteTeam); // Delete team

module.exports = router;
