const express = require("express");
const {
  addStats,
  getStats,
  getGrowth,
  deleteStats,
} = require("../controllers/statsController");

const router = express.Router();

// Player stats operations
router.post("/:playerId/stats", addStats); // Add/create stats for a player
router.get("/:playerId/stats", getStats); // Get stats for a player
router.get("/:playerId/growth", getGrowth); // Get player growth/progression
router.delete("/:statsId", deleteStats); // Delete specific stat record

module.exports = router;
