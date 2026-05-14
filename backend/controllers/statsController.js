const Stats = require("../models/statModel");
const Player = require("../models/playerModel");
const Team = require("../models/teamModel");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const { refreshPlayerMarketValue } = require("./playerController");

/**
 * Add stats for a player (team owner only)
 */
const addStats = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { playerId } = req.params;
    const {
      season,
      matchesPlayed,
      goals,
      assists,
      manOfTheMatchAwards,
      cleanSheets,
      seasonOverallRating,
    } = req.body;

    // Check if player exists
    const player = await Player.findOne({ _id: playerId, isDeleted: false });
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Get team and verify ownership
    const team = await Team.findById(player.team);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only team owner can add stats
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add stats for this player",
      });
    }

    // Check if stats already exist for this season
    const existingStats = await Stats.findOne({
      player: playerId,
      season,
      isDeleted: false,
    });

    if (existingStats) {
      return res.status(400).json({
        success: false,
        message: "Stats for this season already exist. Use update instead.",
      });
    }

    // Create new stats record
    const newStats = new Stats({
      player: playerId,
      season,
      matchesPlayed: matchesPlayed || 0,
      goals: goals || 0,
      assists: assists || 0,
      manOfTheMatchAwards: manOfTheMatchAwards || 0,
      cleanSheets: cleanSheets || 0,
      ...(seasonOverallRating !== undefined && seasonOverallRating !== null
        ? { seasonOverallRating }
        : {}),
    });

    await newStats.save();

    // Add stats to player's stats array
    await Player.findByIdAndUpdate(
      playerId,
      { $push: { stats: newStats._id } },
      { new: true },
    );

    await refreshPlayerMarketValue(player);

    res.status(201).json({
      success: true,
      message: "Stats added successfully",
      data: newStats,
    });
  } catch (err) {
    // Handle duplicate key error for unique constraint
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Stats for this season already exist",
      });
    }

    console.error("Add stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get all stats for a player with pagination
 */
const getStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Verify player exists
    const player = await Player.findOne({ _id: playerId, isDeleted: false });
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Get stats with pagination
    const stats = await Stats.find({ player: playerId, isDeleted: false })
      .skip(skip)
      .limit(limit)
      .sort({ season: -1 });

    const total = await Stats.countDocuments({
      player: playerId,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      message: "Player stats retrieved successfully",
      data: stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get player growth (progression across seasons) using aggregation
 */
const getGrowth = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify player exists
    const player = await Player.findOne({ _id: playerId, isDeleted: false });
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Use aggregation pipeline for efficient calculation
    const growthData = await Stats.aggregate([
      {
        $match: {
          player: new mongoose.Types.ObjectId(playerId),
          isDeleted: false,
        },
      },
      {
        $sort: { season: 1 },
      },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: "$matchesPlayed" },
          totalGoals: { $sum: "$goals" },
          totalAssists: { $sum: "$assists" },
          totalMotm: { $sum: "$manOfTheMatchAwards" },
          totalCleanSheets: { $sum: "$cleanSheets" },
          averageGoalsPerMatch: {
            $avg: {
              $cond: [
                { $gt: ["$matchesPlayed", 0] },
                { $divide: ["$goals", "$matchesPlayed"] },
                0,
              ],
            },
          },
          averageAssistsPerMatch: {
            $avg: {
              $cond: [
                { $gt: ["$matchesPlayed", 0] },
                { $divide: ["$assists", "$matchesPlayed"] },
                0,
              ],
            },
          },
          seasonCount: { $sum: 1 },
        },
      },
    ]);

    // Get season-by-season progression
    const seasonalProgression = await Stats.find({
      player: playerId,
      isDeleted: false,
    })
      .sort({ season: 1 })
      .select(
        "season matchesPlayed goals assists manOfTheMatchAwards cleanSheets seasonOverallRating",
      );

    const growth = growthData[0] || {
      totalMatches: 0,
      totalGoals: 0,
      totalAssists: 0,
      totalMotm: 0,
      totalCleanSheets: 0,
      averageGoalsPerMatch: 0,
      averageAssistsPerMatch: 0,
      seasonCount: 0,
    };

    res.status(200).json({
      success: true,
      message: "Player growth retrieved successfully",
      data: {
        playerName: player.name,
        position: player.position,
        overallRating: player.overallRating,
        potentialRating: player.potentialRating,
        growth,
        seasonalProgression,
      },
    });
  } catch (err) {
    console.error("Get growth error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve player growth",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Update stats record (team owner only)
 */
const updateStats = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { statsId } = req.params;
    const {
      matchesPlayed,
      goals,
      assists,
      manOfTheMatchAwards,
      cleanSheets,
      seasonOverallRating,
    } = req.body;

    // Get stats and verify it exists
    const stats = await Stats.findOne({ _id: statsId, isDeleted: false });
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "Stats record not found",
      });
    }

    // Get player and team to verify ownership
    const player = await Player.findById(stats.player);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const team = await Team.findById(player.team);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only team owner can update stats
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this stats record",
      });
    }

    const updates = {};
    if (matchesPlayed !== undefined) updates.matchesPlayed = matchesPlayed;
    if (goals !== undefined) updates.goals = goals;
    if (assists !== undefined) updates.assists = assists;
    if (manOfTheMatchAwards !== undefined)
      updates.manOfTheMatchAwards = manOfTheMatchAwards;
    if (cleanSheets !== undefined) updates.cleanSheets = cleanSheets;
    if (seasonOverallRating !== undefined)
      updates.seasonOverallRating = seasonOverallRating;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    // Update stats
    const updatedStats = await Stats.findByIdAndUpdate(statsId, updates, {
      new: true,
      runValidators: true,
    });

    await refreshPlayerMarketValue(player);

    res.status(200).json({
      success: true,
      message: "Stats updated successfully",
      data: updatedStats,
    });
  } catch (err) {
    console.error("Update stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Delete stats record (soft delete) - team owner only
 */
const deleteStats = async (req, res) => {
  try {
    const { statsId } = req.params;

    // Get stats and verify it exists
    const stats = await Stats.findById(statsId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "Stats record not found",
      });
    }

    // Get player and team to verify ownership
    const player = await Player.findById(stats.player);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const team = await Team.findById(player.team);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only team owner can delete stats
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this stats record",
      });
    }

    // Soft delete stats
    stats.isDeleted = true;
    stats.deletedAt = new Date();
    await stats.save();

    // Remove stats from player's stats array
    await Player.findByIdAndUpdate(
      stats.player,
      { $pull: { stats: statsId } },
      { new: true },
    );

    await refreshPlayerMarketValue(player);

    res.status(200).json({
      success: true,
      message: "Stats record deleted successfully",
    });
  } catch (err) {
    console.error("Delete stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

module.exports = {
  addStats,
  getStats,
  getGrowth,
  updateStats,
  deleteStats,
};
