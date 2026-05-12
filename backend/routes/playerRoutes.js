const Express = require("express");
const router = Express.Router();
const {
  createPlayer,
  getPlayersByTeam,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} = require("../controllers/playerController");

// Player operations (associated with teams)
router.post("/:teamId/create", createPlayer); // Create player for a specific team
router.get("/:teamId/players", getPlayersByTeam); // Get all players in a team
router.get("/:id", getPlayerById); // Get specific player by ID
router.put("/:id", updatePlayer); // Update player details
router.delete("/:id", deletePlayer); // Delete player

module.exports = router;
