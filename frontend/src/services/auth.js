import { api } from "./api.js";

/**
 * Register a new user
 * POST /api/auth/register
 */
export const registerUser = async (credentials) => {
  return api.post("/api/auth/register", {
    username: credentials.username,
    email: credentials.email,
    password: credentials.password,
    confirmPassword: credentials.confirmPassword,
  });
};

/**
 * Login user
 * POST /api/auth/login
 */
export const loginUser = async (credentials) => {
  return api.post("/api/auth/login", {
    email: credentials.email,
    password: credentials.password,
  });
};

/**
 * Logout user
 * POST /api/auth/logout (requires auth)
 */
export const logoutUser = async () => {
  return api.post("/api/auth/logout");
};
