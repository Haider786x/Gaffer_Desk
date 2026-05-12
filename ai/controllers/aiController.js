const askGemini = require("../services/geminiService");

const buildSquadPrompt = require("../prompts/squadPrompt");

const analyzeSquad = async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: "Team ID is required",
      });
    }

    // Fetch team data from your MAIN backend
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/teams/${teamId}`,
    );

    const data = await response.json();

    if (!data.success) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const team = data.data;

    // Build AI prompt
    const prompt = buildSquadPrompt(team);

    // Ask Gemini
    const analysis = await askGemini(prompt);

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to analyze squad",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeSquad,
};
