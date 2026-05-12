const Team = require("../models/teamModel");
const User = require("../models/userModel");
const Player = require("../models/playerModel");
const Stats = require("../models/statModel");
const { validationResult } = require("express-validator");

/**
 * Create a new team
 */
const createTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, country, city, foundedYear, formation, description } =
      req.body;

    // Create new team with owner
    const newTeam = new Team({
      name,
      country,
      city,
      foundedYear,
      formation,
      description,
      owner: req.user._id,
      players: [],
    });

    await newTeam.save();

    // Add team to user's teams array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { teams: newTeam._id } },
      { new: true },
    );

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: newTeam,
    });
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create team",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get all teams with pagination
 */
const getTeams = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const country = req.query.country ? { country: req.query.country } : {};

    // Find non-deleted teams
    const teams = await Team.find({ isDeleted: false, ...country })
      .populate({
        path: "players",
        options: { limit: 11 },
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Team.countDocuments({ isDeleted: false, ...country });

    res.status(200).json({
      success: true,
      message: "Teams retrieved successfully",
      data: teams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get teams error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve teams",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get a specific team by ID
 */
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findOne({ _id: id, isDeleted: false })
      .populate({
        path: "players",
        match: { isDeleted: false },
      })
      .populate("owner", "username email");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Team retrieved successfully",
      data: team,
    });
  } catch (err) {
    console.error("Get team error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve team",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Update team (only team owner can update)
 */
const updateTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const {
      name,
      country,
      city,
      foundedYear,
      formation,
      description,
      budget,
      league,
    } = req.body;

    // Verify team exists and get it
    const team = await Team.findById(id);
    if (!team || team.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only owner can update
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to modify this team",
      });
    }

    // Update team
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      {
        name,
        country,
        city,
        foundedYear,
        formation,
        description,
        budget,
        league,
      },
      { new: true, runValidators: true },
    ).populate("players");

    res.status(200).json({
      success: true,
      message: "Team updated successfully",
      data: updatedTeam,
    });
  } catch (err) {
    console.error("Update team error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update team",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Delete team (soft delete) - only team owner can delete
 */
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only owner can delete
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this team",
      });
    }

    // Soft delete team
    team.isDeleted = true;
    team.deletedAt = new Date();
    await team.save();

    // Remove team from user's teams array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { teams: id } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (err) {
    console.error("Delete team error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete team",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Calculate and update team's average overall rating
 */
const updateTeamRating = async (teamId) => {
  try {
    const team = await Team.findById(teamId).populate("players");
    if (!team || team.players.length === 0) {
      team.avgOverallRating = 50;
      await team.save();
      return;
    }

    const avgRating =
      team.players.reduce((sum, player) => sum + player.overallRating, 0) /
      team.players.length;

    team.avgOverallRating = Math.round(avgRating);
    await team.save();
  } catch (err) {
    console.error("Error updating team rating:", err);
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  updateTeamRating,
};
