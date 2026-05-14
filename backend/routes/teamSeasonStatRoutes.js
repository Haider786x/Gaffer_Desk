const express = require("express");
const { body, param } = require("express-validator");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  addTeamSeasonStat,
  listTeamSeasonStats,
  getTeamSeasonSummary,
  updateTeamSeasonStat,
  deleteTeamSeasonStat,
} = require("../controllers/teamSeasonStatController");

const router = express.Router();

const nonNeg = (field) =>
  body(field)
    .optional()
    .isInt({ min: 0 })
    .withMessage(`${field} must be a non-negative integer`);
const intAny = (field) =>
  body(field)
    .optional()
    .isInt()
    .withMessage(`${field} must be an integer`);

const validateTeamId = [
  param("teamId").isMongoId().withMessage("Invalid team ID"),
];

const validateStatId = [
  param("statId").isMongoId().withMessage("Invalid stats ID"),
];

const validateCreate = [
  body("season")
    .matches(/^\d{4}\/\d{2}$/)
    .withMessage("Season must be in format YYYY/YY (e.g., 2023/24)"),
  nonNeg("matchesPlayed"),
  nonNeg("wins"),
  nonNeg("draws"),
  nonNeg("losses"),
  nonNeg("goalsFor"),
  nonNeg("goalsAgainst"),
  nonNeg("cleanSheets"),
  nonNeg("points"),
  nonNeg("seasonBudget"),
  nonNeg("seasonSpending"),
  intAny("seasonProfit"),
];

const validateUpdate = [
  nonNeg("matchesPlayed"),
  nonNeg("wins"),
  nonNeg("draws"),
  nonNeg("losses"),
  nonNeg("goalsFor"),
  nonNeg("goalsAgainst"),
  nonNeg("cleanSheets"),
  nonNeg("points"),
  nonNeg("seasonBudget"),
  nonNeg("seasonSpending"),
  intAny("seasonProfit"),
];

router.get(
  "/:teamId/season-stats/summary",
  validateTeamId,
  getTeamSeasonSummary,
);
router.get("/:teamId/season-stats", validateTeamId, listTeamSeasonStats);
router.post(
  "/:teamId/season-stats",
  authMiddleware,
  validateTeamId,
  validateCreate,
  addTeamSeasonStat,
);
router.put(
  "/:teamId/season-stats/:statId",
  authMiddleware,
  validateTeamId,
  validateStatId,
  validateUpdate,
  updateTeamSeasonStat,
);
router.delete(
  "/:teamId/season-stats/:statId",
  authMiddleware,
  validateTeamId,
  validateStatId,
  deleteTeamSeasonStat,
);

module.exports = router;
