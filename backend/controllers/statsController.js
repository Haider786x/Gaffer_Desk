const Stats = require("../models/statModel");
const Player = require("../models/playerModel");

// Add stats for a player
const addStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    const {
      season,
      matchesPlayed,
      goals,
      assists,
      manOfTheMatchAwards,
      cleanSheets,
    } = req.body;

    // Validate required fields
    if (!season || !playerId) {
      return res.status(400).json({
        message: "season and playerId are required",
      });
    }

    // Check if player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
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
    });

    await newStats.save();

    // Add stats to player's stats array
    await Player.findByIdAndUpdate(
      playerId,
      { $push: { stats: newStats._id } },
      { new: true },
    );

    res.status(201).json({
      message: "Stats added successfully",
      stats: newStats,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get all stats for a player
const getStats = async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findById(playerId).populate("stats");
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({
      message: "Player stats retrieved successfully",
      playerStats: player.stats,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get player growth (progression across seasons)
const getGrowth = async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findById(playerId).populate("stats");
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Sort stats by season
    const sortedStats = player.stats.sort((a, b) => {
      return a.season.localeCompare(b.season);
    });

    // Calculate growth metrics
    const growth = {
      totalMatches: sortedStats.reduce(
        (sum, stat) => sum + stat.matchesPlayed,
        0,
      ),
      totalGoals: sortedStats.reduce((sum, stat) => sum + stat.goals, 0),
      totalAssists: sortedStats.reduce((sum, stat) => sum + stat.assists, 0),
      totalMotm: sortedStats.reduce(
        (sum, stat) => sum + stat.manOfTheMatchAwards,
        0,
      ),
      totalCleanSheets: sortedStats.reduce(
        (sum, stat) => sum + stat.cleanSheets,
        0,
      ),
      seasonalProgression: sortedStats,
    };

    res.json({
      message: "Player growth retrieved successfully",
      playerName: player.name,
      growth,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Delete stats record
const deleteStats = async (req, res) => {
  try {
    const { statsId } = req.params;

    const stats = await Stats.findByIdAndDelete(statsId);

    if (!stats) {
      return res.status(404).json({ message: "Stats record not found" });
    }

    // Remove stats from player's stats array
    await Player.findByIdAndUpdate(
      stats.player,
      { $pull: { stats: statsId } },
      { new: true },
    );

    res.json({
      message: "Stats record deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  addStats,
  getStats,
  getGrowth,
  deleteStats,
};
