const User = require("../models/userModel");

// Get user profile
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("teams");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User profile retrieved successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        teams: user.teams,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update user profile
const updateUser = async (req, res) => {
  try {
    const { username, email } = req.body;

    // Check if email is already in use (if being updated)
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Check if username is already in use (if being updated)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already in use" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username, email },
      { new: true, runValidators: true },
    ).populate("teams");

    res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        teams: updatedUser.teams,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Delete user account
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: "User account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get all teams for current user
const getUserTeams = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "teams",
      populate: {
        path: "players",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User teams retrieved successfully",
      teams: user.teams,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  getUser,
  updateUser,
  deleteUser,
  getUserTeams,
};
