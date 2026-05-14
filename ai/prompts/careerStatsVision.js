/**
 * Prompt for extracting career / season stats from a game UI screenshot (FC / FIFA style).
 */
function buildCareerStatsVisionPrompt(defaultSeasonHint) {
  const hint =
    defaultSeasonHint &&
    typeof defaultSeasonHint === "string" &&
    /^\d{4}\/\d{2}$/.test(defaultSeasonHint.trim())
      ? defaultSeasonHint.trim()
      : null;

  return `You are reading a screenshot of a football video game CAREER MODE or PLAYER CAREER statistics screen (e.g. EA FC / FIFA). The image may show club stats, season totals, or a player row.

Task: extract ONLY the statistics that map to a single season row (or multiple rows if a small table of seasons is fully visible).

You MUST respond with ONLY valid JSON (no markdown fences, no commentary). Use this exact shape:
{
  "attributes": {
    "pace": 0,
    "shooting": 0,
    "passing": 0,
    "dribbling": 0,
    "defense": 0,
    "physical": 0,
    "overallRating": 0,
    "potentialRating": 0
  },
  "seasons": [
    {
      "season": "2024/25",
      "matchesPlayed": 0,
      "goals": 0,
      "assists": 0,
      "manOfTheMatchAwards": 0,
      "cleanSheets": 0
    }
  ]
}

Rules:
- Every value must be a non-negative integer.
- "season" must be the string format YYYY/YY (slash, second part is two digits), e.g. 2024/25.
- If the screen shows only one block of totals and NO season label, use this default season string: ${hint ? `"${hint}"` : `"2025/26"`} for that single row.
- Map labels flexibly (any language if readable): Games / Apps / Appearances / Mat / MP / Matches → matchesPlayed. Goals / G → goals. Assists / A → assists. MOTM / Man of the match / Player of the match → manOfTheMatchAwards. Clean sheets / CS → cleanSheets (often for goalkeepers; use 0 if not shown).
- If player attributes (PAC, SHO, PAS, DRI, DEF, PHY) or Overall (OVR) are visible, extract them into the "attributes" object. If they are not visible, leave them as 0 or omit the attributes object.
- If multiple season rows are clearly visible in one table, include one object per row in chronological order (oldest first). If unsure between duplicate rows, prefer the fewest rows that match the visible table.
- If the image is not a stats screen or nothing can be read, return {"seasons":[]}.
`;
}

module.exports = { buildCareerStatsVisionPrompt };
