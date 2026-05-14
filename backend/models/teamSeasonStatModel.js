const mongoose = require("mongoose");

/**
 * Per-season club / team stats (league or career totals for the squad as a whole).
 * Separate from player-linked Stats (individual career rows).
 */
const TeamSeasonStatSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    season: {
      type: String,
      required: true,
      match: /^\d{4}\/\d{2}$/,
    },

    matchesPlayed: {
      type: Number,
      min: 0,
      default: 0,
    },

    wins: {
      type: Number,
      min: 0,
      default: 0,
    },

    draws: {
      type: Number,
      min: 0,
      default: 0,
    },

    losses: {
      type: Number,
      min: 0,
      default: 0,
    },

    goalsFor: {
      type: Number,
      min: 0,
      default: 0,
    },

    goalsAgainst: {
      type: Number,
      min: 0,
      default: 0,
    },

    cleanSheets: {
      type: Number,
      min: 0,
      default: 0,
    },

    points: {
      type: Number,
      min: 0,
      default: 0,
    },

    /**
     * Financial snapshot for this season
     */
    seasonBudget: {
      type: Number,
      min: 0,
      default: 0,
    },

    seasonSpending: {
      type: Number,
      min: 0,
      default: 0,
    },

    seasonProfit: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

TeamSeasonStatSchema.index({ team: 1, season: 1 }, { unique: true, sparse: true });
TeamSeasonStatSchema.index({ team: 1, createdAt: -1 });

TeamSeasonStatSchema.query.active = function active() {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model("TeamSeasonStat", TeamSeasonStatSchema);
