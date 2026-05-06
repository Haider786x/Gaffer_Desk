const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 16,
      max: 45,
    },

    position: {
      type: String,
      enum: [
        "GK",
        "RB",
        "RW",
        "BC",
        "BL",
        "WBC",
        "DM",
        "CM",
        "MR",
        "ML",
        "CAM",
        "RW",
        "LW",
        "CF",
        "ST",
      ],
      required: true,
    },

    preferredFoot: {
      type: String,
      enum: ["Left", "Right", "Both"],
      default: "Right",
    },

    // ATTRIBUTES (0-99 scale)
    pace: {
      type: Number,
      min: 0,
      max: 99,
      default: 50,
    },

    shooting: {
      type: Number,
      min: 0,
      max: 99,
      default: 50,
    },

    passing: {
      type: Number,
      min: 0,
      max: 99,
      default: 50,
    },

    dribbling: {
      type: Number,
      min: 0,
      max: 99,
      default: 50,
    },

    defense: {
      type: Number,
      min: 0,
      max: 99,
      default: 50,
    },

    physical: {
      type: Number,
      min: 0,
      max: 99,
      default: 50,
    },

    // RATING
    overallRating: {
      type: Number,
      min: 0,
      max: 99,
      required: true,
    },

    potentialRating: {
      type: Number,
      min: 0,
      max: 99,
      required: true,
    },

    // RELATIONSHIPS
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    stats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stats",
      },
    ],

    // ADDITIONAL INFO
    nationality: {
      type: String,
      required: true,
    },

    jerseyNumber: {
      type: Number,
      min: 1,
      max: 99,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Injured", "Bench", "Loaned"],
      default: "Active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Player", PlayerSchema);
