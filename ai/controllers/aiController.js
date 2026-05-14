const { askGemini, askGeminiWithImage } = require("../services/geminiService");

const buildSquadPrompt = require("../prompts/squadPrompt");
const { buildChatPrompt } = require("../prompts/chatSystem");
const { buildCareerStatsVisionPrompt } = require("../prompts/careerStatsVision");
const { buildCareerTeamStatsVisionPrompt } = require("../prompts/careerTeamStatsVision");
const { buildSquadImageVisionPrompt } = require("../prompts/squadImageVision");

function mainBackendBase() {
  const raw = process.env.MAIN_BACKEND_URL || "http://localhost:3000";
  const first = String(raw).trim().split(/\s+/)[0];
  return first.replace(/\/+$/, "") || "http://localhost:3000";
}

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
      `${mainBackendBase()}/api/teams/${encodeURIComponent(teamId)}`,
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

const MAX_MESSAGES = 24;
const MAX_MESSAGE_LEN = 4000;

const chat = async (req, res) => {
  try {
    const { messages, teamId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "messages array is required",
      });
    }

    const trimmed = messages.slice(-MAX_MESSAGES);
    for (const m of trimmed) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) {
        return res.status(400).json({
          success: false,
          message: "Each message needs role user or assistant",
        });
      }
      if (String(m.content ?? "").length > MAX_MESSAGE_LEN) {
        return res.status(400).json({
          success: false,
          message: "Message too long",
        });
      }
    }

    const last = trimmed[trimmed.length - 1];
    if (last.role !== "user" || !String(last.content ?? "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Last message must be a non-empty user message",
      });
    }

    let team = null;
    if (teamId) {
      try {
        const r = await fetch(
          `${mainBackendBase()}/api/teams/${encodeURIComponent(String(teamId).trim())}`,
        );
        const data = await r.json();
        if (data.success && data.data) team = data.data;
      } catch {
        // continue without team context
      }
    }

    const prompt = buildChatPrompt(team, trimmed);
    const reply = await askGemini(prompt);

    res.status(200).json({
      success: true,
      reply: typeof reply === "string" ? reply : String(reply ?? ""),
    });
  } catch (error) {
    console.error("AI chat error:", error);

    res.status(500).json({
      success: false,
      message: "Chat failed",
      error: error.message,
    });
  }
};

const SEASON_RE = /^\d{4}\/\d{2}$/;

function parseModelJson(text) {
  const raw = String(text ?? "").trim();
  if (!raw) {
    throw new Error("Empty model response");
  }
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  return JSON.parse(candidate);
}

function clampInt(v, min, max, fallback = 0) {
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeSeasonRow(row, defaultSeason) {
  if (!row || typeof row !== "object") return null;
  let season = typeof row.season === "string" ? row.season.trim() : "";
  if (!SEASON_RE.test(season)) {
    season =
      typeof defaultSeason === "string" && SEASON_RE.test(defaultSeason.trim())
        ? defaultSeason.trim()
        : "";
  }
  if (!SEASON_RE.test(season)) return null;

  return {
    season,
    matchesPlayed: clampInt(row.matchesPlayed, 0, 99999),
    goals: clampInt(row.goals, 0, 99999),
    assists: clampInt(row.assists, 0, 99999),
    manOfTheMatchAwards: clampInt(row.manOfTheMatchAwards, 0, 99999),
    cleanSheets: clampInt(row.cleanSheets, 0, 99999),
  };
}

function normalizeTeamSeasonRow(row, defaultSeason) {
  if (!row || typeof row !== "object") return null;
  let season = typeof row.season === "string" ? row.season.trim() : "";
  if (!SEASON_RE.test(season)) {
    season =
      typeof defaultSeason === "string" && SEASON_RE.test(defaultSeason.trim())
        ? defaultSeason.trim()
        : "";
  }
  if (!SEASON_RE.test(season)) return null;

  return {
    season,
    matchesPlayed: clampInt(row.matchesPlayed, 0, 99999),
    wins: clampInt(row.wins, 0, 99999),
    draws: clampInt(row.draws, 0, 99999),
    losses: clampInt(row.losses, 0, 99999),
    goalsFor: clampInt(row.goalsFor, 0, 99999),
    goalsAgainst: clampInt(row.goalsAgainst, 0, 99999),
    cleanSheets: clampInt(row.cleanSheets, 0, 99999),
    points: clampInt(row.points, 0, 99999),
    recentForm: typeof row.recentForm === "string" ? row.recentForm.trim() : undefined,
    league: typeof row.league === "string" ? row.league.trim() : undefined,
  };
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function extractVisionImagePayload(body) {
  const { imageBase64, mimeType } = body || {};
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return { error: { status: 400, json: { success: false, message: "imageBase64 is required" } } };
  }

  let mime =
    typeof mimeType === "string" ? mimeType.trim().toLowerCase() : "image/png";
  if (mime === "image/jpg") mime = "image/jpeg";
  if (!ALLOWED_MIME.has(mime)) {
    return {
      error: {
        status: 400,
        json: {
          success: false,
          message:
            "mimeType must be image/png, image/jpeg, image/webp, or image/gif",
        },
      },
    };
  }

  let b64 = imageBase64.trim();
  if (b64.startsWith("data:")) {
    const m = b64.match(/^data:([^;]+);base64,(.+)$/i);
    if (m) {
      const inner = m[1].toLowerCase();
      if (ALLOWED_MIME.has(inner)) mime = inner;
      b64 = m[2].replace(/\s/g, "");
    }
  } else {
    b64 = b64.replace(/\s/g, "");
  }

  if (b64.length < 80) {
    return {
      error: {
        status: 400,
        json: { success: false, message: "Image payload is too small" },
      },
    };
  }
  if (b64.length > 12_000_000) {
    return {
      error: {
        status: 400,
        json: { success: false, message: "Image is too large (max ~9MB)" },
      },
    };
  }

  return { mime, b64 };
}

const decodeCareerStatsImage = async (req, res) => {
  try {
    const { defaultSeason, scope } = req.body;
    const prepared = extractVisionImagePayload(req.body);
    if (prepared.error) {
      return res.status(prepared.error.status).json(prepared.error.json);
    }
    const { mime, b64 } = prepared;
    const statScope =
      scope === "team" ? "team" : "player";

    const hint =
      typeof defaultSeason === "string" && SEASON_RE.test(defaultSeason.trim())
        ? defaultSeason.trim()
        : null;

    const prompt =
      statScope === "team"
        ? buildCareerTeamStatsVisionPrompt(hint)
        : buildCareerStatsVisionPrompt(hint);
    const text = await askGeminiWithImage(prompt, {
      mimeType: mime,
      base64Data: b64,
    });

    let parsed;
    try {
      parsed = parseModelJson(text);
    } catch (e) {
      return res.status(422).json({
        success: false,
        message: "Could not parse model output as JSON",
        rawPreview: String(text).slice(0, 400),
      });
    }

    let rawList = [];
    if (Array.isArray(parsed.seasons)) {
      rawList = parsed.seasons;
    } else if (parsed.season && typeof parsed.season === "string") {
      rawList = [parsed];
    }

    const defSeason = hint || "2025/26";
    const seasons = [];
    for (const row of rawList) {
      const n =
        statScope === "team"
          ? normalizeTeamSeasonRow(row, defSeason)
          : normalizeSeasonRow(row, defSeason);
      if (n) seasons.push(n);
    }

    res.status(200).json({
      success: true,
      scope: statScope,
      seasons,
      attributes: parsed.attributes || null,
      message:
        seasons.length === 0
          ? "No seasons could be extracted — try a clearer screenshot or set default season."
          : undefined,
    });
  } catch (error) {
    console.error("decodeCareerStatsImage error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to decode screenshot",
    });
  }
};

const ALLOWED_SQUAD_POS = new Set([
  "GK",
  "RB",
  "LB",
  "CB",
  "RWB",
  "LWB",
  "DM",
  "CM",
  "CAM",
  "RW",
  "LW",
  "CF",
  "ST",
]);

function normalizeSquadVisionPlayer(row) {
  if (!row || typeof row !== "object") return null;
  const name = String(row.name || "").trim();
  if (!name) return null;

  let pos = String(row.position || "ST").trim().toUpperCase();
  if (pos === "CDM") pos = "DM";
  if (pos === "LM") pos = "LW";
  if (pos === "RM") pos = "RW";
  if (!ALLOWED_SQUAD_POS.has(pos)) pos = "ST";

  return {
    name,
    position: pos,
    overallRating: clampInt(row.overallRating, 0, 99, 70),
    age: clampInt(row.age, 16, 45, 23),
    nationality:
      typeof row.nationality === "string" && row.nationality.trim()
        ? row.nationality.trim()
        : "Unknown",
  };
}

const decodeSquadImage = async (req, res) => {
  try {
    const prepared = extractVisionImagePayload(req.body);
    if (prepared.error) {
      return res.status(prepared.error.status).json(prepared.error.json);
    }
    const { mime, b64 } = prepared;

    const prompt = buildSquadImageVisionPrompt();
    const text = await askGeminiWithImage(prompt, {
      mimeType: mime,
      base64Data: b64,
    });

    let parsed;
    try {
      parsed = parseModelJson(text);
    } catch (e) {
      return res.status(422).json({
        success: false,
        message: "Could not parse model output as JSON",
        rawPreview: String(text).slice(0, 400),
      });
    }

    const rawPlayers = Array.isArray(parsed.players) ? parsed.players : [];
    const players = [];
    for (const row of rawPlayers) {
      const n = normalizeSquadVisionPlayer(row);
      if (n) players.push(n);
    }

    res.status(200).json({
      success: true,
      players,
      message:
        players.length === 0
          ? "No players returned — try a clearer lineup screenshot."
          : undefined,
    });
  } catch (error) {
    console.error("decodeSquadImage error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to decode squad image",
    });
  }
};

module.exports = {
  analyzeSquad,
  chat,
  decodeCareerStatsImage,
  decodeSquadImage,
};
