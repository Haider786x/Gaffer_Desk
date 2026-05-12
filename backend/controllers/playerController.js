const Player = require("../models/playerModel");
const Team = require("../models/teamModel");

// Create a new player for a team
const createPlayer = async (req, res) => {
  try {
    const { teamId } = req.params;
    const {
      name,
      age,
      position,
      preferredFoot,
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      overallRating,
      potentialRating,
      nationality,
      jerseyNumber,
      dateOfBirth,
      status,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !age ||
      !position ||
      !overallRating ||
      !potentialRating ||
      !nationality ||
      !dateOfBirth
    ) {
      return res.status(400).json({
        message:
          "name, age, position, overallRating, potentialRating, nationality, and dateOfBirth are required",
      });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Create new player
    const newPlayer = new Player({
      name,
      age,
      position,
      preferredFoot,
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      overallRating,
      potentialRating,
      team: teamId,
      nationality,
      jerseyNumber,
      dateOfBirth,
      status,
      stats: [],
    });

    await newPlayer.save();

    // Add player to team's players array
    await Team.findByIdAndUpdate(
      teamId,
      { $push: { players: newPlayer._id } },
      { new: true },
    );

    res.status(201).json({
      message: "Player created successfully",
      player: newPlayer,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get all players for a specific team
const getPlayersByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate("players");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      message: "Players retrieved successfully",
      players: team.players,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Get a specific player by ID
const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await Player.findById(id).populate("team").populate("stats");
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({
      message: "Player retrieved successfully",
      player,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update player details
const updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      position,
      preferredFoot,
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      overallRating,
      potentialRating,
      nationality,
      jerseyNumber,
      dateOfBirth,
      status,
    } = req.body;

    const updatedPlayer = await Player.findByIdAndUpdate(
      id,
      {
        name,
        age,
        position,
        preferredFoot,
        pace,
        shooting,
        passing,
        dribbling,
        defense,
        physical,
        overallRating,
        potentialRating,
        nationality,
        jerseyNumber,
        dateOfBirth,
        status,
      },
      { new: true, runValidators: true },
    )
      .populate("team")
      .populate("stats");

    if (!updatedPlayer) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({
      message: "Player updated successfully",
      player: updatedPlayer,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Delete player
const deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await Player.findByIdAndDelete(id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Remove player from team's players array
    await Team.findByIdAndUpdate(
      player.team,
      { $pull: { players: id } },
      { new: true },
    );

    res.json({
      message: "Player deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  createPlayer,
  getPlayersByTeam,
  getPlayerById,
  updatePlayer,
  deletePlayer,
};
