const express = require("express");
const { body } = require("express-validator");
const { register, login, logout } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Validation middleware for registration
 */
const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, hyphens, and underscores",
    ),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character",
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password"),
];

/**
 * Validation middleware for login
 */
const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", authMiddleware, logout);

module.exports = router;
