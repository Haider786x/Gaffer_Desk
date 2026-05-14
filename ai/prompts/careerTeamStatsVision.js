/**
 * Prompt for club / league table / team career screenshots (FC / FIFA style).
 */
function buildCareerTeamStatsVisionPrompt(defaultSeasonHint) {
  const hint =
    defaultSeasonHint &&
    typeof defaultSeasonHint === "string" &&
    /^\d{4}\/\d{2}$/.test(defaultSeasonHint.trim())
      ? defaultSeasonHint.trim()
      : null;

  return `You are reading a screenshot of a football club TEAM or LEAGUE screen (e.g. EA FC / FIFA career mode): standings, club season record, or club stats (not a single player's profile).

Task: extract team-level season rows. Respond with ONLY valid JSON (no markdown fences). Shape:
{
  "seasons": [
    {
      "season": "2024/25",
      "matchesPlayed": 0,
      "wins": 0,
      "draws": 0,
      "losses": 0,
      "goalsFor": 0,
      "goalsAgainst": 0,
      "cleanSheets": 0,
      "points": 0,
      "recentForm": "W-W-D-L-W",
      "league": "Premier League"
    }
  ]
}

Rules:
- All values must be non-negative integers.
- "season" format YYYY/YY.
- If only one season block visible with no label, use default season: ${hint ? `"${hint}"` : `"2025/26"`}.
- Map: MP/Games/Played → matchesPlayed; W → wins; D → draws; L → losses; GF/GS scored → goalsFor; GA/GC conceded → goalsAgainst; CS clean sheets (team) → cleanSheets; Pts/Points → points.
- If there is a 'Form' column showing the last 5 matches (e.g. W D L W W), extract it as a string for "recentForm", replacing spaces with hyphens (e.g., "W-D-L-W-W"). If not visible, omit or leave empty.
- If the league name is visible anywhere (e.g. "Premier League", "LaLiga"), extract it for "league". If not visible, omit or leave empty.
- If the image is a single PLAYER profile (not club/league), return {"seasons":[]}.
- If unreadable, return {"seasons":[]}.
`;
}

module.exports = { buildCareerTeamStatsVisionPrompt };
