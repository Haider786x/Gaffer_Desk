const mongoose = require("mongoose");

const StatsSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    season: {
      type: String,
      required: true,
      match: /^\d{4}\/\d{2}$/,
      validate: {
        validator: function (value) {
          const [year, month] = value.split("/").map(Number);
          return (
            year >= 2000 &&
            year <= new Date().getFullYear() + 1 &&
            month >= 0 &&
            month <= 99
          );
        },
        message: "Invalid season format",
      },
    },

    matchesPlayed: {
      type: Number,
      min: 0,
      default: 0,
    },

    goals: {
      type: Number,
      min: 0,
      default: 0,
    },

    assists: {
      type: Number,
      min: 0,
      default: 0,
    },

    manOfTheMatchAwards: {
      type: Number,
      min: 0,
      default: 0,
    },

    cleanSheets: {
      type: Number,
      min: 0,
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

// Create unique compound index to prevent duplicate stats for same player+season
StatsSchema.index({ player: 1, season: 1 }, { unique: true, sparse: true });

// Index for player stats queries
StatsSchema.index({ player: 1, createdAt: -1 });

// Soft delete middleware
StatsSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model("Stats", StatsSchema);
