const Team = require("../models/teamModel");
const User = require("../models/userModel");

// Create a new team
const createTeam = async (req, res) => {
  try {
    const { name, country, city, foundedYear, formation, description } =
      req.body;

    // Validate required fields
    if (!name || !country || !city || !formation) {
      return res.status(400).json({
        message: "name, country, city, and formation are required",
      });
    }

    // Create new team
    const newTeam = new Team({
      name,
      country,
      city,
      foundedYear,
      formation,
      description,
      players: [],
    });

    await newTeam.save();

    // Add team to user's teams array
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { teams: newTeam._id } },
      { new: true },
    ).populate("teams");

    res.status(201).json({
      message: "Team created successfully",
      team: newTeam,
      userTeams: user.teams,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get all teams (or user's teams)
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate("players");

    res.json({
      message: "Teams retrieved successfully",
      teams,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get a specific team by ID
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id).populate("players");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      message: "Team retrieved successfully",
      team,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update team
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, city, foundedYear, formation, description } =
      req.body;

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { name, country, city, foundedYear, formation, description },
      { new: true, runValidators: true },
    ).populate("players");

    if (!updatedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      message: "Team updated successfully",
      team: updatedTeam,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Delete team
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findByIdAndDelete(id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Remove team from user's teams array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { teams: id } },
      { new: true },
    );

    res.json({
      message: "Team deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
};
