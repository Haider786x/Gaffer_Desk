const express = require("express");
const {
  addStats,
  getStats,
  getGrowth,
  deleteStats,
} = require("../controllers/statsController");

const router = express.Router();

router.post("/:playerId/stats", addStats);
router.get("/:playerId/stats", getStats);
router.get("/:playerId/growth", getGrowth);
router.delete("/:statsId", deleteStats);

module.exports = router;
