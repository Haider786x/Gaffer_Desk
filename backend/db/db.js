const mongoose = require("mongoose");
const { MONGODB_URL } = process.env;
const db = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};
module.exports = db;
