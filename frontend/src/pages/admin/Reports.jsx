import { useEffect, useState } from "react";

import Sidebar from "../../components/common/Sidebar.jsx";
import MetricsCard from "../../components/reports/MetricsCard.jsx";
import PerformanceChart from "../../components/reports/PerformanceChart.jsx";
import {
  IconCheck,
  IconClock,
  IconDownload,
  IconTruck,
  IconUser,
} from "../../components/common/icons.jsx";
import {
  downloadDeliveriesCSV,
  fetchDeliveriesPerDay,
  fetchDriverPerformance,
} from "../../api/reports.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useReportSummary } from "../../hooks/useReportSummary.js";

export default function Reports() {
  const { logout } = useAuth();
  const { summary } = useReportSummary();
  const [driverStats, setDriverStats] = useState([]);
  const [dailySeries, setDailySeries] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDriverPerformance().then(setDriverStats).catch(() => setDriverStats([]));
    fetchDeliveriesPerDay(14).then(setDailySeries).catch(() => setDailySeries([]));
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadDeliveriesCSV();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-nexus-navy text-slate-200">
      <Sidebar active="reports" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-nexus-border px-8 py-4">
          <h1 className="text-lg font-semibold text-white">Reportes</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-nexus-border px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-nexus-surface2 disabled:opacity-50"
            >
              <IconDownload width={16} height={16} />
              {exporting ? "Exportando..." : "Exportar CSV"}
            </button>
            <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400">
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricsCard
              label="Tasa de completitud"
              value={summary ? `${summary.completion_rate}%` : "—"}
              hint={summary ? `${summary.delivered} de ${summary.total_deliveries} entregas` : ""}
              hintColor="text-status-delivered"
              Icon={IconCheck}
            />
            <MetricsCard
              label="Tiempo promedio de entrega"
              value={
                summary?.avg_delivery_time_min != null
                  ? `${summary.avg_delivery_time_min} min`
                  : "—"
              }
              hint="Desde creación hasta entrega"
              Icon={IconClock}
            />
            <MetricsCard
              label="Distancia total recorrida"
              value={summary ? `${summary.total_distance_km} km` : "—"}
              hint="Suma de todas las rutas"
              Icon={IconTruck}
            />
            <MetricsCard
              label="Conductores activos"
              value={summary ? summary.active_drivers : "—"}
              hint="Con entregas asignadas"
              Icon={IconUser}
            />
          </div>

          <div className="mt-6">
            <PerformanceChart driverStats={driverStats} dailySeries={dailySeries} />
          </div>

          <div className="mt-6 rounded-xl border border-nexus-border bg-nexus-surface">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-white">Rendimiento por Conductor</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-nexus-border text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Conductor</th>
                    <th className="px-5 py-3 font-medium">Asignadas</th>
                    <th className="px-5 py-3 font-medium">Entregadas</th>
                    <th className="px-5 py-3 font-medium">Completitud</th>
                    <th className="px-5 py-3 font-medium">Distancia</th>
                  </tr>
                </thead>
                <tbody>
                  {driverStats.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        Aún no hay datos de conductores.
                      </td>
                    </tr>
                  )}
                  {driverStats.map((d) => (
                    <tr
                      key={d.driver_id}
                      className="border-b border-nexus-border/60 last:border-0 hover:bg-nexus-surface2/50"
                    >
                      <td className="px-5 py-3 text-white">{d.driver_name}</td>
                      <td className="px-5 py-3 text-slate-400">{d.assigned}</td>
                      <td className="px-5 py-3 text-slate-400">{d.delivered}</td>
                      <td className="px-5 py-3 text-slate-400">{d.completion_rate}%</td>
                      <td className="px-5 py-3 text-slate-400">{d.total_distance_km} km</td>
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
