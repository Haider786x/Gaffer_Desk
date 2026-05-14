const express = require("express");

const router = express.Router();

const {
  analyzeSquad,
  chat,
  decodeCareerStatsImage,
  decodeSquadImage,
} = require("../controllers/aiController");

router.post("/chat", chat);
router.post("/squad-analysis", analyzeSquad);
router.post("/decode-career-stats-image", decodeCareerStatsImage);
router.post("/decode-squad-image", decodeSquadImage);
module.exports = router;
