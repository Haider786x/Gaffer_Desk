const express = require("express");
const { searchRealPlayers } = require("../utils/realPlayersLoader");

const router = express.Router();

router.get("/search", (req, res) => {
  const query = req.query.query ?? "";
  const limitRaw = req.query.limit ?? 10;
  const limit = Math.max(1, Math.min(25, parseInt(limitRaw, 10) || 10));

  try {
    const data = searchRealPlayers({ query, limit }).map((p) => ({
      realId: p.realId,
      name: p.name,
      position: p.position,
      nationality: p.nationality,
      age: p.age,
      preferredFoot: p.preferredFoot,
      overallRating: p.overallRating,
      potentialRating: p.potentialRating,
      pace: p.pace,
      shooting: p.shooting,
      passing: p.passing,
      dribbling: p.dribbling,
      defense: p.defense,
      physical: p.physical,
      dateOfBirth: p.dateOfBirth,
    }));

    res.status(200).json({
      success: true,
      message: "Real players search completed",
      data,
    });
  } catch (err) {
    console.error("Real players search error:", err);
    res.status(500).json({
      success: false,
      message: "Real players search failed",
    });
  }
});

module.exports = router;

