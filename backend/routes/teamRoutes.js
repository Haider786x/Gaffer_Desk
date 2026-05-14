const express = require("express");
const { body, param } = require("express-validator");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  uploadTeamLogo,
} = require("../controllers/teamController");
const { uploadTeamLogoMiddleware } = require("../middleware/uploadImages");

const router = express.Router();

/**
 * Validation middleware for creating/updating team
 */
const validateTeam = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Team name must be 2-100 characters"),
  body("country")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be 2-100 characters"),
  body("city")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be 2-100 characters"),
  body("formation")
    .isIn([
      "3-1-4-2",
      "3-4-1-2",
      "3-4-2-1",
      "3-4-3",
      "3-5-2",
      "4-1-2-1-2",
      "4-1-2-1-2(2)",
      "4-1-3-2",
      "4-1-4-1",
      "4-2-1-3",
      "4-2-2-2",
      "4-2-3-1",
      "4-2-3-1(2)",
      "4-2-4",
      "4-3-1-2",
      "4-3-2-1",
      "4-3-3",
      "4-3-3(2)",
      "4-3-3(3)",
      "4-3-3(4)",
      "4-3-3(5)",
      "4-4-1-1",
      "4-4-1-1(2)",
      "4-4-2",
      "4-4-2(2)",
      "4-5-1",
      "4-5-1(2)",
      "5-2-1-2",
      "5-2-3",
      "5-3-2",
      "5-4-1",
    ])
    .withMessage("Invalid formation"),
  body("foundedYear")
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage("Founded year must be between 1800 and current year"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be max 1000 characters"),
  body("budget")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Budget must be a positive number"),
  body("league")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("League must be max 100 characters"),
];

/**
 * Validation middleware for team ID parameter
 */
const validateTeamId = [param("id").isMongoId().withMessage("Invalid team ID")];

// Routes
router.post("/", authMiddleware, validateTeam, createTeam);
router.get("/", getTeams);
router.post(
  "/:id/logo",
  authMiddleware,
  validateTeamId,
  (req, res, next) => {
    uploadTeamLogoMiddleware(req, res, (err) => {
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
  uploadTeamLogo,
);
router.get("/:id", validateTeamId, getTeamById);
router.put("/:id", authMiddleware, validateTeamId, validateTeam, updateTeam);
router.delete("/:id", authMiddleware, validateTeamId, deleteTeam);

module.exports = router;
