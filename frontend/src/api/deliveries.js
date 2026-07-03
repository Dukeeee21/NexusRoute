/** Deliveries API calls. */
import api from "./axiosConfig.js";

/** List deliveries. `params` may include status, driver, search, page. */
export async function fetchDeliveries(params = {}) {
  const { data } = await api.get("/deliveries/", { params });
  return data; // { count, next, previous, results }
}

export async function fetchDelivery(id) {
  const { data } = await api.get(`/deliveries/${id}/`);
  return data;
}

export async function createDelivery(payload) {
  const { data } = await api.post("/deliveries/", payload);
  return data;
}

export async function updateDelivery(id, payload) {
  const { data } = await api.patch(`/deliveries/${id}/`, payload);
  return data;
}

export async function deleteDelivery(id) {
  await api.delete(`/deliveries/${id}/`);
  return id;
}

/** Transition a delivery's status (PENDING -> IN_TRANSIT -> DELIVERED). */
export async function updateDeliveryStatus(id, status) {
  const { data } = await api.patch(`/deliveries/${id}/status/`, { status });
  return data;
}
