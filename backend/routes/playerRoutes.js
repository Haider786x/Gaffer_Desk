const Express = require("express");
const router = Express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPlayer,
  getPlayersByTeam,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} = require("../controllers/playerController");

// Player operations (associated with teams)
router.post("/:teamId/create", authMiddleware, createPlayer); // Create player for a specific team (protected)
router.get("/:teamId/players", getPlayersByTeam); // Get all players in a team (public)
router.get("/:id", getPlayerById); // Get specific player by ID (public)
router.put("/:id", authMiddleware, updatePlayer); // Update player details (protected)
router.delete("/:id", authMiddleware, deletePlayer); // Delete player (protected)

module.exports = router;
