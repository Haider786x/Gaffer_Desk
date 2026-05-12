const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
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
        "GK", // Goalkeeper
        "RB", // Right Back
        "LB", // Left Back
        "CB", // Center Back
        "RWB", // Right Wing Back
        "LWB", // Left Wing Back
        "DM", // Defensive Midfielder
        "CM", // Central Midfielder
        "CAM", // Central Attacking Midfielder
        "RW", // Right Winger
        "LW", // Left Winger
        "CF", // Center Forward
        "ST", // Striker
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
      validate: {
        validator: function (value) {
          return value >= this.overallRating;
        },
        message: "Potential rating must be >= overall rating",
      },
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
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    jerseyNumber: {
      type: Number,
      min: 1,
      max: 99,
    },

    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          const age = new Date().getFullYear() - value.getFullYear();
          return age >= 16 && age <= 45;
        },
        message: "Player age must be between 16 and 45 based on birthdate",
      },
    },

    status: {
      type: String,
      enum: ["Active", "Injured", "Bench", "Loaned"],
      default: "Active",
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

// Create indexes for frequently queried fields
PlayerSchema.index({ team: 1 });
PlayerSchema.index({ name: "text" });
PlayerSchema.index({ overallRating: -1 });
PlayerSchema.index({ status: 1 });
PlayerSchema.index({ createdAt: -1 });

// Soft delete middleware
PlayerSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model("Player", PlayerSchema);
