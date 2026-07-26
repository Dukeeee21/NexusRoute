/**
 * Explainable breakdown of a Route: origin, each stop in visiting order
 * and the distance travelled to reach it, plus the totals. Mirrors what
 * the backend computed with A* (see apps/routes/algorithms/astar.py).
 */
export default function RouteDetail({ route }) {
  return (
    <div className="rounded-xl border border-nexus-border bg-nexus-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Detalle de la Ruta</h3>
        <span className="text-xs text-slate-400">
          {route.total_distance_km} km · ~{route.estimated_time_min} min
        </span>
      </div>
      <ol className="space-y-2">
        <li className="flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nexus-primary text-xs font-bold text-white">
            O
          </span>
          <span className="text-slate-300">{route.origin_label}</span>
        </li>
        {route.stops.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nexus-surface2 text-xs font-bold text-slate-200">
              {s.order}
            </span>
            <span className="flex-1 truncate text-slate-300">{s.destination_address}</span>
            <span className="shrink-0 text-xs text-slate-500">{s.distance_from_prev_km} km</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
