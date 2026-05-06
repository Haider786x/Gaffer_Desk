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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Stats", StatsSchema);
