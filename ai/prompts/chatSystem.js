const MAX_TEAM_JSON = 12000;

function truncateJson(obj) {
  try {
    const s = JSON.stringify(obj);
    if (s.length <= MAX_TEAM_JSON) return s;
    return `${s.slice(0, MAX_TEAM_JSON)}\n…(truncated)`;
  } catch {
    return "{}";
  }
}

/**
 * Single-turn string prompt for Gemini from chat history + optional team payload.
 */
function buildChatPrompt(team, messages) {
  const lines = messages
    .map((m) => {
      const role = m.role === "assistant" ? "Assistant" : "User";
      return `${role}: ${String(m.content ?? "").trim()}`;
    })
    .join("\n\n");

  const system = `You are Gaffer Desk's in-app assistant for football/soccer club management. Help with squad questions, tactics, formations, player roles, and development ideas. When team JSON is provided, base facts on it—do not invent players or stats. Keep answers concise and actionable. You cannot change the database; you only give advice.`;

  const teamBlock = team
    ? `\n\nTeam data from Gaffer Desk API (authoritative when present):\n${truncateJson(team)}\n`
    : "";

  return `${system}${teamBlock}\n\nConversation:\n${lines}\n\nAssistant:`;
}

module.exports = { buildChatPrompt };
