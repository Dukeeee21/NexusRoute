import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const gridColor = "rgba(148, 163, 184, 0.1)";
const tickColor = "#94a3b8";
const legendStyle = { labels: { color: tickColor } };
const scales = {
  x: { grid: { color: gridColor }, ticks: { color: tickColor } },
  y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true },
};

/**
 * Two-panel performance view fed by /api/reports/: deliveries
 * assigned/delivered per driver (bar) and deliveries created per day
 * over the last two weeks (line).
 */
export default function PerformanceChart({ driverStats, dailySeries }) {
  const barData = {
    labels: driverStats.map((d) => d.driver_name),
    datasets: [
      {
        label: "Asignadas",
        data: driverStats.map((d) => d.assigned),
        backgroundColor: "#3B82F6",
        borderRadius: 4,
      },
      {
        label: "Entregadas",
        data: driverStats.map((d) => d.delivered),
        backgroundColor: "#10B981",
        borderRadius: 4,
      },
    ],
  };

  const lineData = {
    labels: dailySeries.map((d) =>
      new Date(d.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
    ),
    datasets: [
      {
        label: "Entregas por día",
        data: dailySeries.map((d) => d.count),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-xl border border-nexus-border bg-nexus-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Entregas por Conductor</h3>
        {driverStats.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Sin datos todavía.</p>
        ) : (
          <Bar
            data={barData}
            options={{ responsive: true, plugins: { legend: legendStyle }, scales }}
          />
        )}
      </div>

      <div className="rounded-xl border border-nexus-border bg-nexus-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Entregas por Día (últimos {dailySeries.length || 14} días)
        </h3>
        <Line
          data={lineData}
          options={{ responsive: true, plugins: { legend: legendStyle }, scales }}
        />
      </div>
    </div>
  );
}
