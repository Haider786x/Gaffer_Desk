const fs = require("fs");
const mongoose = require("mongoose");
const Player = require("../models/playerModel");
const Team = require("../models/teamModel");
const User = require("../models/userModel");
const Stats = require("../models/statModel");
const { validationResult } = require("express-validator");
const { updateTeamRating } = require("./teamController");
const { unlinkPublicUpload } = require("../utils/uploadPaths");
const { calculatePlayerMarketValue } = require("../utils/marketValueCalculator");

const calculateMarketValueTier = (value) => {
  if (!Number.isFinite(value) || value <= 0) return "Bronze";
  if (value < 5000000) return "Bronze";
  if (value < 20000000) return "Silver";
  if (value < 60000000) return "Gold";
  return "Platinum";
};

const refreshPlayerMarketValue = async (player) => {
  if (!player) return null;
  const playerDoc =
    typeof player.save === "function" ? player : await Player.findById(player._id || player);
  if (!playerDoc || playerDoc.isDeleted) return null;

  const stats = await Stats.find({ player: playerDoc._id, isDeleted: false }).sort({
    season: -1,
  });
  const valueBreakdown = calculatePlayerMarketValue(playerDoc, stats);
  playerDoc.marketValue = valueBreakdown.finalValue;
  await playerDoc.save();
  return valueBreakdown;
};

/**
 * Create a new player for a team (team owner only)
 */
const createPlayer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { teamId } = req.params;
    const {
      name,
      age,
      position,
      preferredFoot,
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      overallRating,
      potentialRating,
      nationality,
      jerseyNumber,
      dateOfBirth,
      status,
      isStarting,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID format",
      });
    }

    // Check if team exists and user owns it
    const team = await Team.findById(teamId);
    if (!team || team.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only team owner can add players
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to add players to this team",
      });
    }

    // Check squad size (reasonable limit)
    const playerCount = await Player.countDocuments({
      team: teamId,
      isDeleted: false,
    });
    if (playerCount >= 100) {
      return res.status(400).json({
        success: false,
        message: "Team has reached maximum player limit (100)",
      });
    }

    // Create new player
    const newPlayer = new Player({
      name,
      age,
      position,
      preferredFoot,
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      overallRating,
      potentialRating,
      team: teamId,
      nationality,
      jerseyNumber,
      dateOfBirth,
      status,
      isStarting,
      stats: [],
    });

    await newPlayer.save();

    await refreshPlayerMarketValue(newPlayer);

    // Add player to team's players array
    await Team.findByIdAndUpdate(
      teamId,
      { $push: { players: newPlayer._id } },
      { new: true },
    );

    // Update team's average rating
    await updateTeamRating(teamId);

    const createdPlayer = await Player.findById(newPlayer._id)
      .populate("team")
      .populate("stats");

    res.status(201).json({
      success: true,
      message: "Player created successfully",
      data: createdPlayer || newPlayer,
    });
  } catch (err) {
    console.error("Create player error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create player",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get all players for a specific team with pagination
 */
const getPlayersByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const status = req.query.status ? { status: req.query.status } : {};

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID format",
      });
    }

    const team = await Team.findOne({ _id: teamId, isDeleted: false });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const players = await Player.find({
      team: teamId,
      isDeleted: false,
      ...status,
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Player.countDocuments({
      team: teamId,
      isDeleted: false,
      ...status,
    });

    res.status(200).json({
      success: true,
      message: "Players retrieved successfully",
      data: players,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get players error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve players",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get a specific player by ID
 */
const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid player ID format",
      });
    }

    const player = await Player.findOne({ _id: id, isDeleted: false })
      .populate({
        path: "team",
        match: { isDeleted: false },
      })
      .populate("stats")
      .lean();

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Player retrieved successfully",
      data: player,
    });
  } catch (err) {
    console.error("Get player error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve player",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Update player details (team owner only)
 */
const updatePlayer = async (req, res) => {
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
      age,
      position,
      preferredFoot,
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      overallRating,
      potentialRating,
      nationality,
      jerseyNumber,
      dateOfBirth,
      status,
      isStarting,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid player ID format",
      });
    }

    // Get player and verify it exists
    const player = await Player.findById(id);
    if (!player || player.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Get team and verify user owns it
    const team = await Team.findById(player.team);
    if (!team || team.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only team owner can update players
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this player",
      });
    }

    // Update player
    const updatedPlayer = await Player.findByIdAndUpdate(
      id,
      {
        name,
        age,
        position,
        preferredFoot,
        pace,
        shooting,
        passing,
        dribbling,
        defense,
        physical,
        overallRating,
        potentialRating,
        nationality,
        jerseyNumber,
        dateOfBirth,
        status,
        isStarting,
      },
      { new: true, runValidators: true },
    )
      .populate("team")
      .populate("stats");

    // Update team's average rating
    await updateTeamRating(player.team);

    await refreshPlayerMarketValue(updatedPlayer);

    const refreshedPlayer = await Player.findById(id).populate("team").populate("stats");

    res.status(200).json({
      success: true,
      message: "Player updated successfully",
      data: refreshedPlayer || updatedPlayer,
    });
  } catch (err) {
    console.error("Update player error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update player",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Delete player (soft delete) - team owner only
 */
const deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid player ID format",
      });
    }

    const player = await Player.findById(id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // Get team and verify user owns it
    const team = await Team.findById(player.team);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check authorization - only team owner can delete players
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this player",
      });
    }

    if (player.photoUrl) {
      unlinkPublicUpload(player.photoUrl);
    }

    // Soft delete player
    player.isDeleted = true;
    player.deletedAt = new Date();
    await player.save();

    // Remove player from team's players array
    await Team.findByIdAndUpdate(
      player.team,
      { $pull: { players: id } },
      { new: true },
    );

    // Update team's average rating
    await updateTeamRating(player.team);

    res.status(200).json({
      success: true,
      message: "Player deleted successfully",
    });
  } catch (err) {
    console.error("Delete player error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete player",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Upload / replace player headshot (owner only). Field name: multipart "photo"
 */
const uploadPlayerPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded (use form field name "photo")',
      });
    }

    const { id } = req.params;
    const player = await Player.findOne({ _id: id, isDeleted: false });
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const team = await Team.findById(player.team);
    if (!team || team.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this player",
      });
    }

    const base64Str = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    player.photoUrl = `data:${mimeType};base64,${base64Str}`;
    await player.save();

    res.status(200).json({
      success: true,
      message: "Player photo updated",
      data: player,
    });
  } catch (err) {
    console.error("uploadPlayerPhoto error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to upload photo",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Get calculated market value breakdown for a player
 */
const getPlayerMarketValue = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await Player.findOne({ _id: id, isDeleted: false });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const stats = await Stats.find({ player: id, isDeleted: false }).sort({ season: -1 });
    const valueBreakdown = calculatePlayerMarketValue(player, stats);

    if (player.marketValue !== valueBreakdown.finalValue) {
      player.marketValue = valueBreakdown.finalValue;
      await player.save();
    }

    res.status(200).json({
      success: true,
      message: "Player market value retrieved successfully",
      data: {
        playerId: player._id,
        playerName: player.name,
        marketValue: player.marketValue ?? valueBreakdown.finalValue,
        tier: calculateMarketValueTier(player.marketValue ?? valueBreakdown.finalValue),
        breakdown: valueBreakdown,
      },
    });
  } catch (err) {
    console.error("Get player market value error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve player market value",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * Update contract expiry and current form (team owner only)
 */
const updatePlayerContract = async (req, res) => {
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
    const { contractExpiry, currentForm } = req.body;

    const player = await Player.findOne({ _id: id, isDeleted: false });
    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const team = await Team.findById(player.team);
    if (!team || team.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this player contract",
      });
    }

    if (contractExpiry !== undefined) {
      player.contractExpiry = contractExpiry ? new Date(contractExpiry) : null;
    }
    if (currentForm !== undefined) {
      player.currentForm = Number(currentForm);
    }

    const valueBreakdown = await refreshPlayerMarketValue(player);

    res.status(200).json({
      success: true,
      message: "Player contract details updated successfully",
      data: {
        player,
        marketValue: {
          marketValue: player.marketValue ?? valueBreakdown?.finalValue ?? null,
          tier: calculateMarketValueTier(
            player.marketValue ?? valueBreakdown?.finalValue ?? 0,
          ),
          breakdown: valueBreakdown,
        },
      },
    });
  } catch (err) {
    console.error("Update player contract error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update player contract details",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

module.exports = {
  createPlayer,
  getPlayersByTeam,
  getPlayerById,
  getPlayerMarketValue,
  updatePlayerContract,
  updatePlayer,
  deletePlayer,
  uploadPlayerPhoto,
  refreshPlayerMarketValue,
};
