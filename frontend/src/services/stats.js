import { api } from "./api.js";

function optNonNegInt(value) {
  if (value === "" || value == null) return undefined;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function optRating(value) {
  if (value === "" || value == null) return undefined;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n >= 0 && n <= 99 ? n : undefined;
}

/**
 * Add stats for a player (season)
 * POST /api/stats/:playerId/stats (requires auth, owner only)
 */
export const addStats = async (playerId, statsData) => {
  const body = {
    season: statsData.season,
  };

  const mp = optNonNegInt(statsData.matchesPlayed);
  const g = optNonNegInt(statsData.goals);
  const a = optNonNegInt(statsData.assists);
  const motm = optNonNegInt(statsData.manOfTheMatchAwards);
  const cs = optNonNegInt(statsData.cleanSheets);
  const ovr = optRating(statsData.seasonOverallRating);

  if (mp !== undefined) body.matchesPlayed = mp;
  if (g !== undefined) body.goals = g;
  if (a !== undefined) body.assists = a;
  if (motm !== undefined) body.manOfTheMatchAwards = motm;
  if (cs !== undefined) body.cleanSheets = cs;
  if (ovr !== undefined) body.seasonOverallRating = ovr;

  return api.post(`/api/stats/${playerId}/stats`, body);
};

/**
 * Get all stats for a player (paginated)
 * GET /api/stats/:playerId/stats
 */
export const getPlayerStats = async (playerId, page = 1, limit = 10) => {
  const params = new URLSearchParams({ page, limit }).toString();
  return api.get(`/api/stats/${playerId}/stats?${params}`);
};

/**
 * Get player growth (progression across seasons)
 * GET /api/stats/:playerId/growth
 */
export const getPlayerGrowth = async (playerId) => {
  return api.get(`/api/stats/${playerId}/growth`);
};

/**
 * Update stats record
 * PUT /api/stats/:statsId (requires auth, owner only)
 */
export const updateStats = async (statsId, statsData) => {
  const body = {};

  const mp = optNonNegInt(statsData.matchesPlayed);
  const g = optNonNegInt(statsData.goals);
  const a = optNonNegInt(statsData.assists);
  const motm = optNonNegInt(statsData.manOfTheMatchAwards);
  const cs = optNonNegInt(statsData.cleanSheets);
  const ovr = optRating(statsData.seasonOverallRating);

  if (mp !== undefined) body.matchesPlayed = mp;
  if (g !== undefined) body.goals = g;
  if (a !== undefined) body.assists = a;
  if (motm !== undefined) body.manOfTheMatchAwards = motm;
  if (cs !== undefined) body.cleanSheets = cs;
  if (ovr !== undefined) body.seasonOverallRating = ovr;

  return api.put(`/api/stats/${statsId}`, body);
};

/**
 * Delete stats record (soft delete)
 * DELETE /api/stats/:statsId (requires auth, owner only)
 */
export const deleteStats = async (statsId) => {
  return api.delete(`/api/stats/${statsId}`);
};
