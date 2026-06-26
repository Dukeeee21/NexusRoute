/** Authentication API calls. */
import api from "./axiosConfig.js";

/**
 * Log in with username/password.
 * Returns { access, refresh, user } from the backend.
 */
export async function login(username, password) {
  const { data } = await api.post("/auth/token/", { username, password });
  return data;
}

/** Fetch the currently authenticated user's profile. */
export async function fetchCurrentUser() {
  const { data } = await api.get("/users/me/");
  return data;
}
