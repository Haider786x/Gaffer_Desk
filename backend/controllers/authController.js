const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email, password, confirmPassword } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Check if user already exists - using unique indexes will handle race conditions
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user
    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        teams: [],
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    // Handle duplicate key error from MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      return res.status(400).json({
        success: false,
        message: `${fieldName} already in use`,
      });
    }

    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message:
          "Account locked due to multiple failed login attempts. Please try again later.",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account if max attempts reached
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        await user.save();

        return res.status(403).json({
          success: false,
          message:
            "Too many failed login attempts. Account locked for 15 minutes.",
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = null;
    }

    user.lastLogin = new Date();
    await user.save();

    // Populate teams
    await user.populate("teams");

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        teams: user.teams,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Logout user (optional - mainly for frontend to clear token)
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  register,
  login,
  logout,
};
