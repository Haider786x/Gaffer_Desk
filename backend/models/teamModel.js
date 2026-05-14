const mongoose = require("mongoose");

const formations = [
  // 3 at the Back
  "3-1-4-2",
  "3-4-1-2",
  "3-4-2-1",
  "3-4-3",
  "3-5-2",

  // 4 at the Back
  "4-1-2-1-2",
  "4-1-2-1-2(2)",
  "4-1-3-2",
  "4-1-4-1",
  "4-2-1-3",
  "4-2-2-2",
  "4-2-3-1",
  "4-2-3-1(2)",
  "4-2-4",
  "4-3-1-2",
  "4-3-2-1",
  "4-3-3",
  "4-3-3(2)",
  "4-3-3(3)",
  "4-3-3(4)",
  "4-3-3(5)",
  "4-4-1-1",
  "4-4-1-1(2)",
  "4-4-2",
  "4-4-2(2)",
  "4-5-1",
  "4-5-1(2)",

  // 5 at the Back
  "5-2-1-2",
  "5-2-3",
  "5-3-2",
  "5-4-1",
];

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },

    formation: {
      type: String,
      enum: formations,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],

    avgOverallRating: {
      type: Number,
      min: 0,
      max: 99,
      default: 50,
    },

    budget: {
      type: Number,
      min: 0,
      default: 0,
    },

    league: {
      type: String,
      trim: true,
      default: "",
    },

    recentForm: {
      type: String,
      trim: true,
      default: "",
    },

    /** Public URL path served from /uploads/teams/… */
    logoUrl: {
      type: String,
      trim: true,
      default: "",
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
TeamSchema.index({ owner: 1 });
TeamSchema.index({ country: 1 });
TeamSchema.index({ name: "text" });
TeamSchema.index({ createdAt: -1 });
TeamSchema.index({ avgOverallRating: -1 });

// Soft delete middleware
TeamSchema.query.active = function () {
  return this.where({ isDeleted: false });
};

module.exports = mongoose.model("Team", TeamSchema);
