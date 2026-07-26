/** Reports API calls (admin-only endpoints). */
import api from "./axiosConfig.js";

export async function fetchPerformanceSummary() {
  const { data } = await api.get("/reports/performance/");
  return data;
}

export async function fetchDriverPerformance() {
  const { data } = await api.get("/reports/by-driver/");
  return data;
}

export async function fetchDeliveriesPerDay(days = 14) {
  const { data } = await api.get("/reports/deliveries-per-day/", { params: { days } });
  return data;
}

/**
 * Downloads the CSV export. Uses axios (not a plain <a href>) so the
 * request carries the JWT Authorization header — a direct link would
 * hit the API unauthenticated and get a 401.
 */
export async function downloadDeliveriesCSV() {
  const { data } = await api.get("/reports/export/", { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "entregas_nexusroute.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
