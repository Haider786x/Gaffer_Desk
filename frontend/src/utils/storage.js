import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from "./constants.js";

function migrateLegacyAuthOnce() {
  if (typeof localStorage === "undefined") return;
  try {
    if (!localStorage.getItem(STORAGE_KEYS.TOKEN) && LEGACY_STORAGE_KEYS.TOKEN) {
      const oldT = localStorage.getItem(LEGACY_STORAGE_KEYS.TOKEN);
      const oldU = localStorage.getItem(LEGACY_STORAGE_KEYS.USER);
      if (oldT) localStorage.setItem(STORAGE_KEYS.TOKEN, oldT);
      if (oldU) localStorage.setItem(STORAGE_KEYS.USER, oldU);
      localStorage.removeItem(LEGACY_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(LEGACY_STORAGE_KEYS.USER);
    }
  } catch {
    /* ignore */
  }
}

migrateLegacyAuthOnce();

/**
 * Local Storage Manager
 */
export const storage = {
  // Token Management
  setToken: (token) => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  },

  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  removeToken: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  // User Management
  setUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LEGACY_STORAGE_KEYS.USER);
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
};
