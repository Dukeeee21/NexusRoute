/** Shared formatting helpers. */

/** "10:45 AM" style time from an ISO timestamp. */
export function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "26 jun 2026" style date from an ISO timestamp. */
export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
