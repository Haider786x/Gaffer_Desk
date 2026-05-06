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
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
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
    },

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
      },
    ],

    avgOverallRating: {
      type: Number,
      min: 50,
      max: 99,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Team", TeamSchema);
