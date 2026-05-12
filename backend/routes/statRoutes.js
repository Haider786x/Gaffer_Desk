const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  addStats,
  getStats,
  getGrowth,
  deleteStats,
} = require("../controllers/statsController");

const router = express.Router();

// Stats operations (protected routes)
router.post("/:playerId/stats", authMiddleware, addStats); // Add stats for player (protected)
router.get("/:playerId/stats", getStats); // Get stats for player (public)
router.get("/:playerId/growth", getGrowth); // Get player growth (public)
router.delete("/:statsId", authMiddleware, deleteStats); // Delete stats (protected)

module.exports = router;
