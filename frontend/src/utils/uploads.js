import { API_BASE_URL } from "./constants.js";

/** Build a browser URL for `/uploads/...` paths stored on the API server */
export function publicUploadUrl(path) {
  if (!path || typeof path !== "string") return "";
  if (path.startsWith("data:")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}
