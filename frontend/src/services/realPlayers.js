import { api } from "./api.js";

/**
 * Search real players (derived from the provided EAFC26 CSV on the backend)
 * GET /api/real-players/search?query=&limit=
 */
export const searchRealPlayers = async (query, limit = 10) => {
  const params = new URLSearchParams({
    query: query ?? "",
    limit: String(limit),
  }).toString();

  return api.get(`/api/real-players/search?${params}`);
};

