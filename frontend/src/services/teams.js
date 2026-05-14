import { api } from "./api.js";

/**
 * Create a new team
 * POST /api/teams (requires auth)
 */
export const createTeam = async (teamData) => {
  const body = {
    name: teamData.name,
    country: teamData.country,
    city: teamData.city,
    formation: teamData.formation,
  };

  if (teamData.foundedYear) body.foundedYear = parseInt(teamData.foundedYear);
  if (teamData.description) body.description = teamData.description;
  if (teamData.budget !== undefined) body.budget = parseInt(teamData.budget);
  if (teamData.league) body.league = teamData.league;

  return api.post("/api/teams", body);
};

/**
 * Get all teams (public, paginated)
 * GET /api/teams
 */
export const getTeams = async (page = 1, limit = 10, country = null) => {
  const params = new URLSearchParams({ page, limit });
  if (country) params.append("country", country);

  return api.get(`/api/teams?${params.toString()}`);
};

/**
 * Get a specific team by ID (public)
 * GET /api/teams/:id
 */
export const getTeamById = async (teamId) => {
  const id = teamId != null ? String(teamId).trim() : "";
  if (!id || id === "undefined") {
    return Promise.reject({
      status: 400,
      message: "Invalid team id",
      errors: [],
    });
  }
  return api.get(`/api/teams/${encodeURIComponent(id)}`);
};

/**
 * Update a team (requires auth, owner only)
 * PUT /api/teams/:id
 */
export const updateTeam = async (teamId, teamData) => {
  const body = {
    name: teamData.name,
    country: teamData.country,
    city: teamData.city,
    formation: teamData.formation,
  };

  if (teamData.foundedYear) body.foundedYear = parseInt(teamData.foundedYear);
  if (teamData.description) body.description = teamData.description;
  if (teamData.budget !== undefined) body.budget = parseInt(teamData.budget);
  if (teamData.league) body.league = teamData.league;

  return api.put(`/api/teams/${teamId}`, body);
};

/**
 * Delete a team (soft delete, requires auth, owner only)
 * DELETE /api/teams/:id
 */
export const deleteTeam = async (teamId) => {
  return api.delete(`/api/teams/${teamId}`);
};

/**
 * Upload team crest / logo (multipart field name: logo)
 * POST /api/teams/:id/logo
 */
export const uploadTeamLogo = async (teamId, file) => {
  const fd = new FormData();
  fd.append("logo", file);
  return api.postForm(`/api/teams/${encodeURIComponent(teamId)}/logo`, fd);
};
