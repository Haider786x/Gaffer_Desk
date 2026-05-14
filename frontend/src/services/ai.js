import { AI_API_BASE_URL } from "../utils/constants.js";
import {
  runDedupedAiRequest,
  fingerprintImagePayload,
  hashTextSample,
} from "./aiRequestManager.js";

function rejectOffline(error) {
  const isOffline =
    error?.name === "TypeError" &&
    (String(error.message).includes("fetch") ||
      String(error.message).includes("Failed to fetch"));
  return Promise.reject({
    status: 0,
    message: isOffline
      ? "Cannot reach the AI service. Is it running?"
      : error.message || "Network error occurred",
    errors: [],
  });
}

async function aiPostJson(path, body, options = {}) {
  const { signal } = options;
  const url = `${AI_API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    const rawText = await response.text();
    let data = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        return Promise.reject({
          status: response.status || 0,
          message: "AI service returned non-JSON response",
          errors: [],
        });
      }
    }

    if (!response.ok) {
      return Promise.reject({
        status: response.status,
        message: data.message || "Request failed",
        errors: data.errors || [],
      });
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      return Promise.reject({
        status: 0,
        message: "Request cancelled",
        errors: [],
      });
    }
    return rejectOffline(error);
  }
}

/**
 * POST /api/ai/squad-analysis — user-triggered tactical write-up only (never mount-mounted elsewhere).
 */
export const analyzeSquad = async (teamId, options = {}) => {
  const id = teamId != null ? String(teamId).trim() : "";
  if (!id || id === "undefined") {
    return Promise.reject({
      status: 400,
      message: "Invalid team id",
      errors: [],
    });
  }
  const body = { teamId: id };
  const fp = hashTextSample(JSON.stringify(body));
  return runDedupedAiRequest("squad-analysis", fp, () =>
    aiPostJson("/api/ai/squad-analysis", body, options),
  );
};

/**
 * POST /api/ai/chat — conversational assistant with optional team context.
 * Not deduped: consecutive identical prompts must remain distinct turns.
 */
export const sendTeamChat = async (payload, options = {}) => {
  return aiPostJson("/api/ai/chat", payload, options);
};

/**
 * Decode career stats from a game screenshot (Gemini vision).
 */
export const decodeCareerStatsFromScreenshot = async (payload, options = {}) => {
  const fp = fingerprintImagePayload(payload);
  return runDedupedAiRequest(`decode-career:${fp}`, fp, () =>
    aiPostJson("/api/ai/decode-career-stats-image", payload, options),
  );
};

/**
 * Decode squad list (XI + bench) from an image — dedicated endpoint (single Gemini vision call).
 */
export const decodeSquadFromScreenshot = async (payload, options = {}) => {
  const fp = fingerprintImagePayload(payload);
  return runDedupedAiRequest(`decode-squad:${fp}`, fp, () =>
    aiPostJson("/api/ai/decode-squad-image", payload, options),
  );
};
