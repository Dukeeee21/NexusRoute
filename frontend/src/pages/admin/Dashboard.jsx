import { Link } from "react-router-dom";

import Sidebar from "../../components/common/Sidebar.jsx";
import DeliveryStatusBadge from "../../components/deliveries/DeliveryStatusBadge.jsx";
import MetricsCard from "../../components/reports/MetricsCard.jsx";
import {
  IconBell,
  IconBox,
  IconCheck,
  IconLogout,
  IconSettings,
  IconTruck,
  IconUser,
} from "../../components/common/icons.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useDeliveries } from "../../hooks/useDeliveries.js";
import { useReportSummary } from "../../hooks/useReportSummary.js";
import { formatTime } from "../../utils/formatters.js";

// Refresh the recent-deliveries table (and the KPI summary) on an
// interval so the dispatcher notices when a driver marks a delivery as
// completed, without needing a websocket server (see roadmap Phase 5:
// "notificación al admin... vía polling").
const POLL_MS = 15000;

// All four cards now come straight from GET /api/reports/performance/
// (Phase 6) — no more mocked values.
function buildMetrics(summary) {
  const s = summary ?? {};
  const na = "—";
  return [
    {
      label: "Entregas totales",
      value: summary ? String(s.total_deliveries) : na,
      hint: summary ? `${s.completion_rate}% completadas` : "",
      hintColor: "text-status-delivered",
      Icon: IconBox,
    },
    {
      label: "En tránsito",
      value: summary ? String(s.in_transit) : na,
      hint: "Activas",
      hintColor: "text-status-transit",
      Icon: IconTruck,
    },
    {
      label: "Entregadas",
      value: summary ? String(s.delivered) : na,
      hint: summary ? `${s.completion_rate}% éxito` : "",
      hintColor: "text-status-delivered",
      Icon: IconCheck,
    },
    {
      label: "Conductores activos",
      value: summary ? String(s.active_drivers) : na,
      hint: "Con entregas asignadas",
      hintColor: "text-slate-400",
      Icon: IconUser,
    },
  ];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { deliveries, loading, error } = useDeliveries(undefined, { pollMs: POLL_MS });
  const { summary } = useReportSummary({ pollMs: POLL_MS });
  const displayName = user?.first_name || user?.username || "Admin";

  const recent = deliveries.slice(0, 5);
  const metrics = buildMetrics(summary);

  return (
    <div className="flex min-h-screen bg-nexus-navy text-slate-200">
      <Sidebar active="dashboard" />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-4 border-b border-nexus-border px-8 py-4">
          <button className="text-slate-400 hover:text-slate-200" aria-label="Notificaciones">
            <IconBell width={20} height={20} />
          </button>
          <button className="text-slate-400 hover:text-slate-200" aria-label="Configuración">
            <IconSettings width={20} height={20} />
          </button>
          <div className="flex items-center gap-3 border-l border-nexus-border pl-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{displayName}</p>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
              >
                <IconLogout width={12} height={12} />
                Cerrar sesión
              </button>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-nexus-surface2 text-nexus-primary">
              <IconUser width={18} height={18} />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
          <p className="mt-1 text-sm text-slate-400">
            Resumen de operaciones en tiempo real.
          </p>

          {/* Metrics */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((m) => (
              <MetricsCard key={m.label} {...m} />
            ))}
          </div>

          {/* Recent deliveries */}
          <div className="mt-8 rounded-xl border border-nexus-border bg-nexus-surface">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Entregas Recientes</h2>
                <span
                  className="flex items-center gap-1 text-[11px] text-slate-500"
                  title={`Se actualiza sola cada ${POLL_MS / 1000}s`}
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-delivered" />
                  en vivo
                </span>
              </div>
              <Link
                to="/admin/deliveries"
                className="text-xs font-medium text-nexus-primary hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-nexus-border text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Destino</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        Cargando entregas...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-red-400">
                        No se pudieron cargar las entregas.
                      </td>
                    </tr>
                  )}
                  {!loading && !error && recent.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        Aún no hay entregas registradas.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    recent.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-nexus-border/60 last:border-0 hover:bg-nexus-surface2/50"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-slate-400">
                          {d.package?.tracking_code}
                        </td>
                        <td className="px-5 py-3 font-medium text-white">
                          {d.package?.client_name}
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {d.package?.destination_address}
                        </td>
                        <td className="px-5 py-3">
                          <DeliveryStatusBadge status={d.status} />
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {formatTime(d.created_at)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
