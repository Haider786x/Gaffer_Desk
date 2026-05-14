import { API_BASE_URL } from "../utils/constants.js";
import { storage } from "../utils/storage.js";

/**
 * Fetch-based API client with interceptors
 */
export const api = {
  /**
   * Generic fetch wrapper
   */
  request: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = storage.getToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const rawText = await response.text();
      let data = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          return Promise.reject({
            status: response.status || 0,
            message:
              response.status >= 400
                ? rawText.slice(0, 200) || "Request failed"
                : "Server returned non-JSON response",
            errors: [],
          });
        }
      }

      // Handle 401 - Token expired or invalid
      if (response.status === 401) {
        storage.clearAuth();
        window.location.href = "/login";
        return Promise.reject({
          status: 401,
          message: data.message || "Unauthorized. Please login again.",
          errors: data.errors || [],
        });
      }

      // Handle 403 - Forbidden
      if (response.status === 403) {
        return Promise.reject({
          status: 403,
          message: data.message || "Access forbidden",
          errors: data.errors || [],
        });
      }

      // Handle other error status codes
      if (!response.ok) {
        return Promise.reject({
          status: response.status,
          message: data.message || "An error occurred",
          errors: data.errors || [],
        });
      }

      // Return data on success
      return data;
    } catch (error) {
      const isOffline =
        error?.name === "TypeError" &&
        (String(error.message).includes("fetch") ||
          String(error.message).includes("Failed to fetch"));
      return Promise.reject({
        status: 0,
        message: isOffline
          ? "Cannot reach the API. Start the backend (port 3000) or check your network."
          : error.message || "Network error occurred",
        errors: [],
      });
    }
  },

  /**
   * GET request
   */
  get: (endpoint, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "GET",
    });
  },

  /**
   * POST request
   */
  post: (endpoint, body = {}, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT request
   */
  put: (endpoint, body = {}, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE request
   */
  delete: (endpoint, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  },

  /**
   * POST multipart (FormData). Does not set Content-Type (browser sets boundary).
   */
  postForm: async (endpoint, formData, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = storage.getToken();
    const headers = { ...options.headers };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      const response = await fetch(url, {
        ...options,
        method: "POST",
        body: formData,
        headers,
      });
      const rawText = await response.text();
      let data = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          return Promise.reject({
            status: response.status || 0,
            message:
              response.status >= 400
                ? rawText.slice(0, 200) || "Request failed"
                : "Server returned non-JSON response",
            errors: [],
          });
        }
      }
      if (response.status === 401) {
        storage.clearAuth();
        window.location.href = "/login";
        return Promise.reject({
          status: 401,
          message: data.message || "Unauthorized. Please login again.",
          errors: data.errors || [],
        });
      }
      if (response.status === 403) {
        return Promise.reject({
          status: 403,
          message: data.message || "Access forbidden",
          errors: data.errors || [],
        });
      }
      if (!response.ok) {
        return Promise.reject({
          status: response.status,
          message: data.message || "An error occurred",
          errors: data.errors || [],
        });
      }
      return data;
    } catch (error) {
      const isOffline =
        error?.name === "TypeError" &&
        (String(error.message).includes("fetch") ||
          String(error.message).includes("Failed to fetch"));
      return Promise.reject({
        status: 0,
        message: isOffline
          ? "Cannot reach the API. Start the backend (port 3000) or check your network."
          : error.message || "Network error occurred",
        errors: [],
      });
    }
  },

  /**
   * PATCH request
   */
  patch: (endpoint, body = {}, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};
