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

const statFieldValidators = [
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
  body("seasonOverallRating")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Season overall must be between 0 and 99"),
];

/**
 * Validation for creating stats (season required)
 */
const validateStatsCreate = [
  body("season")
    .matches(/^\d{4}\/\d{2}$/)
    .withMessage("Season must be in format YYYY/YY (e.g., 2023/24)"),
  ...statFieldValidators,
];

/**
 * Validation for updating stats (numeric fields only; all optional)
 */
const validateStatsUpdate = [...statFieldValidators];

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
  validateStatsCreate,
  addStats,
);
router.get("/:playerId/stats", validatePlayerId, getStats);
router.get("/:playerId/growth", validatePlayerId, getGrowth);
router.put(
  "/:statsId",
  authMiddleware,
  validateStatsId,
  validateStatsUpdate,
  updateStats,
);
router.delete("/:statsId", authMiddleware, validateStatsId, deleteStats);

module.exports = router;
