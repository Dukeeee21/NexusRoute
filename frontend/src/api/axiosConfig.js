/**
 * Shared Axios instance for the NexusRoute API.
 *
 * - Attaches the JWT access token to every request.
 * - On a 401, tries to refresh the token once and replays the request.
 *   If the refresh fails, the user is sent back to /login.
 */
import axios from "axios";

import { TOKEN_KEYS } from "../utils/constants.js";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: refresh-on-401 ──────────────────────────────────────
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true;
      const refresh = localStorage.getItem(TOKEN_KEYS.REFRESH);

      if (refresh) {
        try {
          isRefreshing = true;
          const { data } = await axios.post("/api/auth/token/refresh/", { refresh });
          localStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
