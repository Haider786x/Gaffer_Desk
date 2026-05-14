/**
 * Vision prompt for extracting a squad / XI list from a tactical or lineup screenshot.
 */
function buildSquadImageVisionPrompt() {
  return `You are reading a screenshot of a football tactical board, lineup screen, or squad view (e.g. EA FC / FM-style). Extract every clearly visible outfield player or goalkeeper with their on-screen label.

You MUST respond with ONLY valid JSON (no markdown fences, no commentary). Use this exact shape:
{
  "players": [
    {
      "name": "M. Example",
      "position": "ST",
      "overallRating": 87,
      "age": 24,
      "nationality": "France"
    }
  ]
}

Rules:
- "position" MUST be one of: GK, RB, LB, CB, RWB, LWB, DM, CM, CAM, RW, LW, CF, ST.
- Map CDM→DM, LM→LW if needed, RM→RW, etc.
- Omit a player if the name or role cannot be read with reasonable confidence.
- "overallRating", "age" are non-negative integers; omit or use 0 if not visible.
- "nationality" may be omitted or empty if unknown.
- If this is not a football lineup image, return {"players":[]}.
`;
}

module.exports = { buildSquadImageVisionPrompt };
