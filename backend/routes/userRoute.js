const express = require("express");
const { body } = require("express-validator");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getUser,
  updateUser,
  deleteUser,
  getUserTeams,
} = require("../controllers/userController");

const router = express.Router();

/**
 * Validation middleware for updating user profile
 */
const validateUserUpdate = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, hyphens, and underscores",
    ),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
];

// User profile management routes (all protected)
router.get("/profile", authMiddleware, getUser);
router.put("/profile", authMiddleware, validateUserUpdate, updateUser);
router.delete("/profile", authMiddleware, deleteUser);

// User teams management route (protected)
router.get("/teams", authMiddleware, getUserTeams);

module.exports = router;
