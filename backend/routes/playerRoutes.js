const express = require("express");
const { body, param } = require("express-validator");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createPlayer,
  getPlayersByTeam,
  getPlayerById,
  getPlayerMarketValue,
  updatePlayerContract,
  updatePlayer,
  deletePlayer,
  uploadPlayerPhoto,
} = require("../controllers/playerController");
const { uploadPlayerPhotoMiddleware } = require("../middleware/uploadImages");

const router = express.Router();

/**
 * Validation middleware for creating/updating player
 */
const validatePlayer = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Player name must be 2-100 characters"),
  body("age")
    .isInt({ min: 16, max: 45 })
    .withMessage("Age must be between 16 and 45"),
  body("position")
    .isIn([
      "GK",
      "RB",
      "LB",
      "CB",
      "RWB",
      "LWB",
      "DM",
      "CM",
      "CAM",
      "RW",
      "LW",
      "CF",
      "ST",
    ])
    .withMessage("Invalid position"),
  body("nationality")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nationality must be 2-100 characters"),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Invalid date format (use ISO 8601: YYYY-MM-DD)"),
  body("overallRating")
    .isInt({ min: 0, max: 99 })
    .withMessage("Overall rating must be between 0 and 99"),
  body("potentialRating")
    .isInt({ min: 0, max: 99 })
    .withMessage("Potential rating must be between 0 and 99")
    .custom((val, { req }) => {
      if (parseInt(val, 10) < parseInt(req.body.overallRating, 10)) {
        throw new Error("Potential rating must be >= overall rating");
      }
      return true;
    }),
  body("preferredFoot")
    .optional()
    .isIn(["Left", "Right", "Both"])
    .withMessage("Invalid preferred foot"),
  body("pace")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Pace must be between 0 and 99"),
  body("shooting")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Shooting must be between 0 and 99"),
  body("passing")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Passing must be between 0 and 99"),
  body("dribbling")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Dribbling must be between 0 and 99"),
  body("defense")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Defense must be between 0 and 99"),
  body("physical")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Physical must be between 0 and 99"),
  body("jerseyNumber")
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage("Jersey number must be between 1 and 99"),
  body("status")
    .optional()
    .isIn(["Active", "Injured", "Bench", "Loaned"])
    .withMessage("Invalid status"),
];

/**
 * Validation middleware for IDs
 */
const validateTeamId = [
  param("teamId").isMongoId().withMessage("Invalid team ID"),
];

const validatePlayerId = [
  param("id").isMongoId().withMessage("Invalid player ID"),
];

const validateContractUpdate = [
  body("contractExpiry")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Invalid contract expiry date (use ISO 8601)"),
  body("currentForm")
    .optional()
    .isInt({ min: 0, max: 99 })
    .withMessage("Current form must be between 0 and 99"),
];

// Routes
router.post(
  "/:teamId/create",
  authMiddleware,
  validateTeamId,
  validatePlayer,
  createPlayer,
);
router.get("/:teamId/players", validateTeamId, getPlayersByTeam);
router.post(
  "/:id/photo",
  authMiddleware,
  validatePlayerId,
  (req, res, next) => {
    uploadPlayerPhotoMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message:
            err.code === "LIMIT_FILE_SIZE"
              ? "File too large (max 2MB)"
              : err.message || "Upload failed",
        });
      }
      next();
    });
  },
  uploadPlayerPhoto,
);
router.get("/:id", validatePlayerId, getPlayerById);
router.get("/:id/market-value", validatePlayerId, getPlayerMarketValue);
router.put(
  "/:id/contract",
  authMiddleware,
  validatePlayerId,
  validateContractUpdate,
  updatePlayerContract,
);
router.put(
  "/:id",
  authMiddleware,
  validatePlayerId,
  validatePlayer,
  updatePlayer,
);
router.delete("/:id", authMiddleware, validatePlayerId, deletePlayer);

module.exports = router;
