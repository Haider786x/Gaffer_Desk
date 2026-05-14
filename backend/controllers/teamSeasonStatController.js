const Team = require("../models/teamModel");
const TeamSeasonStat = require("../models/teamSeasonStatModel");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

async function loadTeamForOwner(teamId, userId) {
  const team = await Team.findOne({
    _id: teamId,
    isDeleted: false,
  });
  if (!team) {
    return { error: { status: 404, message: "Team not found" } };
  }
  if (team.owner.toString() !== String(userId)) {
    return { error: { status: 403, message: "You don't have permission to manage this team's stats" } };
  }
  return { team };
}

/**
 * POST — add team season row (owner only)
 */
const addTeamSeasonStat = async (req, res) => {
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
      season,
      matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      cleanSheets,
      points,
      seasonBudget,
      seasonSpending,
      seasonProfit,
      recentForm,
      league,
    } = req.body;

    const gate = await loadTeamForOwner(teamId, req.user._id);
    if (gate.error) {
      return res.status(gate.error.status).json({
        success: false,
        message: gate.error.message,
      });
    }

    const existing = await TeamSeasonStat.findOne({
      team: teamId,
      season,
      isDeleted: false,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Stats for this season already exist. Use update instead.",
      });
    }

    const row = new TeamSeasonStat({
      team: teamId,
      season,
      matchesPlayed: matchesPlayed ?? 0,
      wins: wins ?? 0,
      draws: draws ?? 0,
      losses: losses ?? 0,
      goalsFor: goalsFor ?? 0,
      goalsAgainst: goalsAgainst ?? 0,
      cleanSheets: cleanSheets ?? 0,
      points: points ?? 0,
      seasonBudget: seasonBudget ?? 0,
      seasonSpending: seasonSpending ?? 0,
      seasonProfit: seasonProfit ?? 0,
    });

    await row.save();

    const teamUpdates = {};
    if (recentForm) teamUpdates.recentForm = recentForm;
    if (league) teamUpdates.league = league;
    if (Object.keys(teamUpdates).length > 0) {
      await Team.findByIdAndUpdate(teamId, teamUpdates);
    }

    res.status(201).json({
      success: true,
      message: "Team season stats added",
      data: row,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Stats for this season already exist",
      });
    }
    console.error("addTeamSeasonStat:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add team season stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * GET — list team season rows (paginated, public if team exists)
 */
const listTeamSeasonStats = async (req, res) => {
  try {
    const { teamId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const team = await Team.findOne({ _id: teamId, isDeleted: false });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const rows = await TeamSeasonStat.find({ team: teamId, isDeleted: false })
      .sort({ season: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TeamSeasonStat.countDocuments({
      team: teamId,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      message: "Team season stats retrieved",
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listTeamSeasonStats:", err);
    res.status(500).json({
      success: false,
      message: "Failed to list team season stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * GET — rolled-up totals across seasons (same team)
 */
const getTeamSeasonSummary = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findOne({ _id: teamId, isDeleted: false });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const agg = await TeamSeasonStat.aggregate([
      {
        $match: {
          team: new mongoose.Types.ObjectId(String(teamId)),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          seasonCount: { $sum: 1 },
          totalMatches: { $sum: "$matchesPlayed" },
          totalWins: { $sum: "$wins" },
          totalDraws: { $sum: "$draws" },
          totalLosses: { $sum: "$losses" },
          totalGF: { $sum: "$goalsFor" },
          totalGA: { $sum: "$goalsAgainst" },
          totalCleanSheets: { $sum: "$cleanSheets" },
          totalPoints: { $sum: "$points" },
          totalSeasonBudget: { $sum: "$seasonBudget" },
          totalSeasonSpending: { $sum: "$seasonSpending" },
          totalSeasonProfit: { $sum: "$seasonProfit" },
        },
      },
    ]);

    const g = agg[0] || {
      seasonCount: 0,
      totalMatches: 0,
      totalWins: 0,
      totalDraws: 0,
      totalLosses: 0,
      totalGF: 0,
      totalGA: 0,
      totalCleanSheets: 0,
      totalPoints: 0,
      totalSeasonBudget: 0,
      totalSeasonSpending: 0,
      totalSeasonProfit: 0,
    };

    res.status(200).json({
      success: true,
      message: "Team season summary",
      data: {
        teamName: team.name,
        seasonCount: g.seasonCount,
        totals: {
          matchesPlayed: g.totalMatches,
          wins: g.totalWins,
          draws: g.totalDraws,
          losses: g.totalLosses,
          goalsFor: g.totalGF,
          goalsAgainst: g.totalGA,
          cleanSheets: g.totalCleanSheets,
          points: g.totalPoints,
          seasonBudget: g.totalSeasonBudget,
          seasonSpending: g.totalSeasonSpending,
          seasonProfit: g.totalSeasonProfit,
        },
      },
    });
  } catch (err) {
    console.error("getTeamSeasonSummary:", err);
    res.status(500).json({
      success: false,
      message: "Failed to build summary",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * PUT — update one row (owner)
 */
const updateTeamSeasonStat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { teamId, statId } = req.params;

    const gate = await loadTeamForOwner(teamId, req.user._id);
    if (gate.error) {
      return res.status(gate.error.status).json({
        success: false,
        message: gate.error.message,
      });
    }

    const row = await TeamSeasonStat.findOne({
      _id: statId,
      team: teamId,
      isDeleted: false,
    });
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Season stats record not found",
      });
    }

    const {
      matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      cleanSheets,
      points,
      seasonBudget,
      seasonSpending,
      seasonProfit,
    } = req.body;

    const updates = {};
    if (matchesPlayed !== undefined) updates.matchesPlayed = matchesPlayed;
    if (wins !== undefined) updates.wins = wins;
    if (draws !== undefined) updates.draws = draws;
    if (losses !== undefined) updates.losses = losses;
    if (goalsFor !== undefined) updates.goalsFor = goalsFor;
    if (goalsAgainst !== undefined) updates.goalsAgainst = goalsAgainst;
    if (cleanSheets !== undefined) updates.cleanSheets = cleanSheets;
    if (points !== undefined) updates.points = points;
    if (seasonBudget !== undefined) updates.seasonBudget = seasonBudget;
    if (seasonSpending !== undefined) updates.seasonSpending = seasonSpending;
    if (seasonProfit !== undefined) updates.seasonProfit = seasonProfit;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const updated = await TeamSeasonStat.findByIdAndUpdate(statId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Team season stats updated",
      data: updated,
    });
  } catch (err) {
    console.error("updateTeamSeasonStat:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update team season stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

/**
 * DELETE — soft delete (owner)
 */
const deleteTeamSeasonStat = async (req, res) => {
  try {
    const { teamId, statId } = req.params;

    const gate = await loadTeamForOwner(teamId, req.user._id);
    if (gate.error) {
      return res.status(gate.error.status).json({
        success: false,
        message: gate.error.message,
      });
    }

    const row = await TeamSeasonStat.findOne({
      _id: statId,
      team: teamId,
      isDeleted: false,
    });
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Season stats record not found",
      });
    }

    row.isDeleted = true;
    row.deletedAt = new Date();
    await row.save();

    res.status(200).json({
      success: true,
      message: "Team season stats removed",
    });
  } catch (err) {
    console.error("deleteTeamSeasonStat:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete team season stats",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

module.exports = {
  addTeamSeasonStat,
  listTeamSeasonStats,
  getTeamSeasonSummary,
  updateTeamSeasonStat,
  deleteTeamSeasonStat,
};
