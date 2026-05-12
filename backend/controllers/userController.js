const User = require("../models/userModel");
const Team = require("../models/teamModel");
const Player = require("../models/playerModel");
const Stats = require("../models/statModel");
const { validationResult } = require("express-validator");

/**
 * Get user profile
 */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("teams");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        teams: user.teams,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Update user profile
 */
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email } = req.body;
    const updateData = {};

    // Check if email is being updated and if it's already in use
    if (email && email.toLowerCase() !== req.user.email.toLowerCase()) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      updateData.email = email.toLowerCase();
    }

    // Check if username is being updated and if it's already in use
    if (
      username &&
      username.toLowerCase() !== req.user.username.toLowerCase()
    ) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already in use",
        });
      }
      updateData.username = username.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).populate("teams");

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        teams: updatedUser.teams,
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user profile",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Delete user account and all associated data (cascade delete)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete all associated data for each team
    for (const teamId of user.teams) {
      const team = await Team.findById(teamId);
      if (team) {
        // Get all players in team
        const players = await Player.find({ team: teamId });

        // Delete all stats for all players in team
        for (const player of players) {
          await Stats.deleteMany({ player: player._id });
        }

        // Delete all players in team
        await Player.deleteMany({ team: teamId });
      }

      // Delete team
      await Team.findByIdAndDelete(teamId);
    }

    // Finally delete the user
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: "User account and all associated data deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete user account",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get all teams for current user with pagination
 */
const getUserTeams = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get teams with pagination
    const teams = await Team.find({ _id: { $in: user.teams } })
      .populate({
        path: "players",
        options: { limit: 11 }, // Limit players shown per team
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = user.teams.length;

    res.status(200).json({
      success: true,
      message: "User teams retrieved successfully",
      data: teams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get user teams error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user teams",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

module.exports = {
  getUser,
  updateUser,
  deleteUser,
  getUserTeams,
};
