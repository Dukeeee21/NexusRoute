/** Admin-only user lookups (used to populate driver pickers, etc). */
import api from "./axiosConfig.js";

export async function fetchDrivers() {
  const { data } = await api.get("/users/", {
    params: { role: "DRIVER", is_active: true },
  });
  return data.results ?? data;
}
