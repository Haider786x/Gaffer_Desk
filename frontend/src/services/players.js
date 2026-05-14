import { api } from "./api.js";

/**
 * Create a new player for a team
 * POST /api/players/:teamId/create (requires auth, owner only)
 */
export const createPlayer = async (teamId, playerData) => {
  const body = {
    name: playerData.name,
    age: parseInt(playerData.age),
    position: playerData.position,
    nationality: playerData.nationality,
    dateOfBirth: playerData.dateOfBirth,
    overallRating: parseInt(playerData.overallRating),
    potentialRating: parseInt(playerData.potentialRating),
  };

  if (playerData.preferredFoot) body.preferredFoot = playerData.preferredFoot;

  const optInt = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };

  const pace = optInt(playerData.pace);
  if (pace != null) body.pace = pace;
  const shooting = optInt(playerData.shooting);
  if (shooting != null) body.shooting = shooting;
  const passing = optInt(playerData.passing);
  if (passing != null) body.passing = passing;
  const dribbling = optInt(playerData.dribbling);
  if (dribbling != null) body.dribbling = dribbling;
  const defense = optInt(playerData.defense);
  if (defense != null) body.defense = defense;
  const physical = optInt(playerData.physical);
  if (physical != null) body.physical = physical;

  if (playerData.jerseyNumber !== undefined && playerData.jerseyNumber !== "") {
    const j = parseInt(playerData.jerseyNumber, 10);
    if (Number.isFinite(j)) body.jerseyNumber = j;
  }
  if (playerData.status) body.status = playerData.status;

  return api.post(`/api/players/${teamId}/create`, body);
};

/**
 * Get all players for a specific team (paginated)
 * GET /api/players/:teamId/players
 */
export const getPlayersByTeam = async (
  teamId,
  page = 1,
  limit = 10,
  status = null,
) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append("status", status);

  return api.get(`/api/players/${teamId}/players?${params.toString()}`);
};

/**
 * Get a specific player by ID
 * GET /api/players/:id
 */
export const getPlayerById = async (playerId) => {
  return api.get(`/api/players/${playerId}`);
};

/**
 * Update a player
 * PUT /api/players/:id (requires auth, owner only)
 */
export const updatePlayer = async (playerId, playerData) => {
  const body = {
    name: playerData.name,
    age: parseInt(playerData.age),
    position: playerData.position,
    nationality: playerData.nationality,
    dateOfBirth: playerData.dateOfBirth,
    overallRating: parseInt(playerData.overallRating),
    potentialRating: parseInt(playerData.potentialRating),
  };

  if (playerData.preferredFoot) body.preferredFoot = playerData.preferredFoot;
  const optInt = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const pace = optInt(playerData.pace);
  if (pace != null) body.pace = pace;
  const shooting = optInt(playerData.shooting);
  if (shooting != null) body.shooting = shooting;
  const passing = optInt(playerData.passing);
  if (passing != null) body.passing = passing;
  const dribbling = optInt(playerData.dribbling);
  if (dribbling != null) body.dribbling = dribbling;
  const defense = optInt(playerData.defense);
  if (defense != null) body.defense = defense;
  const physical = optInt(playerData.physical);
  if (physical != null) body.physical = physical;
  if (playerData.jerseyNumber !== undefined && playerData.jerseyNumber !== "") {
    const j = parseInt(playerData.jerseyNumber, 10);
    if (Number.isFinite(j)) body.jerseyNumber = j;
  }
  if (playerData.status) body.status = playerData.status;

  return api.put(`/api/players/${playerId}`, body);
};

/**
 * Delete a player (soft delete)
 * DELETE /api/players/:id (requires auth, owner only)
 */
export const deletePlayer = async (playerId) => {
  return api.delete(`/api/players/${playerId}`);
};

/**
 * Upload player headshot (multipart field name: photo)
 * POST /api/players/:id/photo
 */
export const uploadPlayerPhoto = async (playerId, file) => {
  const fd = new FormData();
  fd.append("photo", file);
  return api.postForm(`/api/players/${encodeURIComponent(playerId)}/photo`, fd);
};

/**
 * Get player market value with breakdown
 * GET /api/players/:id/market-value
 */
export const getPlayerMarketValue = async (playerId) => {
  return api.get(`/api/players/${playerId}/market-value`);
};

/**
 * Update player contract expiry and current form
 * PUT /api/players/:id/contract
 */
export const updatePlayerContract = async (playerId, payload) => {
  const body = {};
  if (payload.contractExpiry !== undefined) {
    body.contractExpiry = payload.contractExpiry || null;
  }
  if (payload.currentForm !== undefined && payload.currentForm !== "") {
    const form = parseInt(payload.currentForm, 10);
    if (Number.isFinite(form)) body.currentForm = form;
  }
  return api.put(`/api/players/${playerId}/contract`, body);
};
