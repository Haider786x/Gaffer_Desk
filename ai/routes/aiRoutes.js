const express = require("express");

const router = express.Router();

const { analyzeSquad } = require("../controllers/aiController");

router.post("/squad-analysis", analyzeSquad);

module.exports = router;
