/** Route optimization and assignment API calls. */
import api from "./axiosConfig.js";

/** Preview an optimized order without persisting anything. */
export async function previewOptimizedRoute(payload) {
  const { data } = await api.post("/routes/optimize/", payload);
  return data;
}

/** List persisted route assignments (admins see all, drivers see their own). */
export async function fetchRoutes(params = {}) {
  const { data } = await api.get("/routes/", { params });
  return data;
}

/**
 * Create a route: optimizes the given deliveries with A* and assigns
 * them to a driver/vehicle. Returns the saved plan with its stops.
 */
export async function createRoute(payload) {
  const { data } = await api.post("/routes/", payload);
  return data;
}

/** The configured depot { label, lat, lng } — default origin for deliveries. */
export async function fetchDepot() {
  const { data } = await api.get("/routes/depot/");
  return data;
}
