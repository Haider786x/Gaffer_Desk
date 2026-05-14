import { api } from "./api.js";

/**
 * Get current user profile
 * GET /api/users/profile (requires auth)
 */
export const getUserProfile = async () => {
  return api.get("/api/users/profile");
};

/**
 * Update user profile
 * PUT /api/users/profile (requires auth)
 */
export const updateUserProfile = async (data) => {
  const body = {};
  if (data.username) body.username = data.username;
  if (data.email) body.email = data.email;

  return api.put("/api/users/profile", body);
};

/**
 * Delete user account and all associated data
 * DELETE /api/users/profile (requires auth)
 */
export const deleteUserAccount = async () => {
  return api.delete("/api/users/profile");
};

/**
 * Get current user's teams (paginated)
 * GET /api/users/teams (requires auth)
 */
export const getUserTeams = async (page = 1, limit = 10) => {
  const params = new URLSearchParams({ page, limit }).toString();
  return api.get(`/api/users/teams?${params}`);
};
