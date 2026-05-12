const express = require("express");
const { body, param } = require("express-validator");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  addStats,
  getStats,
  getGrowth,
  updateStats,
  deleteStats,
} = require("../controllers/statsController");

const router = express.Router();

/**
 * Validation middleware for adding/updating stats
 */
const validateStats = [
  body("season")
    .matches(/^\d{4}\/\d{2}$/)
    .withMessage("Season must be in format YYYY/YY (e.g., 2023/24)"),
  body("matchesPlayed")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Matches played must be a non-negative integer"),
  body("goals")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Goals must be a non-negative integer"),
  body("assists")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Assists must be a non-negative integer"),
  body("manOfTheMatchAwards")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Man of the match awards must be a non-negative integer"),
  body("cleanSheets")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Clean sheets must be a non-negative integer"),
];

/**
 * Validation middleware for IDs
 */
const validatePlayerId = [
  param("playerId").isMongoId().withMessage("Invalid player ID"),
];

const validateStatsId = [
  param("statsId").isMongoId().withMessage("Invalid stats ID"),
];

// Routes
router.post(
  "/:playerId/stats",
  authMiddleware,
  validatePlayerId,
  validateStats,
  addStats,
);
router.get("/:playerId/stats", validatePlayerId, getStats);
router.get("/:playerId/growth", validatePlayerId, getGrowth);
router.put(
  "/:statsId",
  authMiddleware,
  validateStatsId,
  validateStats,
  updateStats,
);
router.delete("/:statsId", authMiddleware, validateStatsId, deleteStats);

module.exports = router;
