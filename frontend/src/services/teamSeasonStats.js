import { api } from "./api.js";

function optNonNegInt(value) {
  if (value === "" || value == null) return undefined;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function optInt(value) {
  if (value === "" || value == null) return undefined;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) ? n : undefined;
}

function buildTeamStatBody(data) {
  const body = {};
  const m = optNonNegInt(data.matchesPlayed);
  const w = optNonNegInt(data.wins);
  const dr = optNonNegInt(data.draws);
  const l = optNonNegInt(data.losses);
  const gf = optNonNegInt(data.goalsFor);
  const ga = optNonNegInt(data.goalsAgainst);
  const cs = optNonNegInt(data.cleanSheets);
  const pts = optNonNegInt(data.points);
  const budget = optNonNegInt(data.seasonBudget);
  const spending = optNonNegInt(data.seasonSpending);
  const profit = optInt(data.seasonProfit);
  if (m !== undefined) body.matchesPlayed = m;
  if (w !== undefined) body.wins = w;
  if (dr !== undefined) body.draws = dr;
  if (l !== undefined) body.losses = l;
  if (gf !== undefined) body.goalsFor = gf;
  if (ga !== undefined) body.goalsAgainst = ga;
  if (cs !== undefined) body.cleanSheets = cs;
  if (pts !== undefined) body.points = pts;
  if (budget !== undefined) body.seasonBudget = budget;
  if (spending !== undefined) body.seasonSpending = spending;
  if (profit !== undefined) body.seasonProfit = profit;
  if (data.recentForm !== undefined) body.recentForm = data.recentForm;
  if (data.league !== undefined) body.league = data.league;
  return body;
}

/**
 * GET /api/teams/:teamId/season-stats/summary
 */
export const getTeamSeasonSummary = async (teamId) => {
  return api.get(
    `/api/teams/${encodeURIComponent(teamId)}/season-stats/summary`,
  );
};

/**
 * GET /api/teams/:teamId/season-stats
 */
export const listTeamSeasonStats = async (teamId, page = 1, limit = 10) => {
  const params = new URLSearchParams({ page, limit }).toString();
  return api.get(
    `/api/teams/${encodeURIComponent(teamId)}/season-stats?${params}`,
  );
};

/**
 * POST /api/teams/:teamId/season-stats
 */
export const addTeamSeasonStat = async (teamId, data) => {
  const body = {
    season: data.season,
    ...buildTeamStatBody({
      matchesPlayed: data.matchesPlayed,
      wins: data.wins,
      draws: data.draws,
      losses: data.losses,
      goalsFor: data.goalsFor,
      goalsAgainst: data.goalsAgainst,
      cleanSheets: data.cleanSheets,
      points: data.points,
      seasonBudget: data.seasonBudget,
      seasonSpending: data.seasonSpending,
      seasonProfit: data.seasonProfit,
      recentForm: data.recentForm,
      league: data.league,
    }),
  };
  return api.post(
    `/api/teams/${encodeURIComponent(teamId)}/season-stats`,
    body,
  );
};

/**
 * PUT /api/teams/:teamId/season-stats/:statId
 */
export const updateTeamSeasonStat = async (teamId, statId, data) => {
  return api.put(
    `/api/teams/${encodeURIComponent(teamId)}/season-stats/${encodeURIComponent(statId)}`,
    buildTeamStatBody(data),
  );
};

/**
 * DELETE /api/teams/:teamId/season-stats/:statId
 */
export const deleteTeamSeasonStat = async (teamId, statId) => {
  return api.delete(
    `/api/teams/${encodeURIComponent(teamId)}/season-stats/${encodeURIComponent(statId)}`,
  );
};
