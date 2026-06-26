import Sidebar from "../../components/common/Sidebar.jsx";
import DeliveryStatusBadge from "../../components/deliveries/DeliveryStatusBadge.jsx";
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
import { DELIVERY_STATUS } from "../../utils/constants.js";

// Mock data mirroring the Stitch design. Real data arrives in Phase 4
// (metrics from the reports API, table from the deliveries API).
const METRICS = [
  { label: "Entregas totales", value: "1,284", hint: "+12% esta semana", hintColor: "text-status-delivered", Icon: IconBox },
  { label: "En tránsito", value: "45", hint: "Activas", hintColor: "text-status-transit", Icon: IconTruck },
  { label: "Entregadas", value: "1,120", hint: "98% éxito", hintColor: "text-status-delivered", Icon: IconCheck },
  { label: "Conductores activos", value: "32", hint: "32/40 turnos cubiertos", hintColor: "text-slate-400", Icon: IconUser },
];

const RECENT = [
  { id: "#NX-8801", client: "TechCorp Ltda.", dest: "Zona Norte, Centro Logístico A", status: DELIVERY_STATUS.IN_TRANSIT, time: "10:45 AM" },
  { id: "#NX-8802", client: "Distribuidora SUR", dest: "Almacén 4, Parque Industrial Sur", status: DELIVERY_STATUS.PENDING, time: "10:30 AM" },
  { id: "#NX-8803", client: "MegaRetail S.A.", dest: "Tienda Central, Av. Principal 123", status: DELIVERY_STATUS.DELIVERED, time: "09:15 AM" },
  { id: "#NX-8804", client: "Hospital General", dest: "Sector Suministros Médicos", status: DELIVERY_STATUS.DELIVERED, time: "08:42 AM" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const displayName = user?.first_name || user?.username || "Admin";

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
            {METRICS.map(({ label, value, hint, hintColor, Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-nexus-border bg-nexus-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-slate-500">
                    <Icon width={18} height={18} />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-white">{value}</p>
                <p className={`mt-1 text-xs ${hintColor}`}>{hint}</p>
              </div>
            ))}
          </div>

          {/* Recent deliveries */}
          <div className="mt-8 rounded-xl border border-nexus-border bg-nexus-surface">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-white">Entregas Recientes</h2>
              <button className="text-xs font-medium text-nexus-primary hover:underline">
                Ver todas
              </button>
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
                  {RECENT.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-nexus-border/60 last:border-0 hover:bg-nexus-surface2/50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{row.id}</td>
                      <td className="px-5 py-3 font-medium text-white">{row.client}</td>
                      <td className="px-5 py-3 text-slate-400">{row.dest}</td>
                      <td className="px-5 py-3">
                        <DeliveryStatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-400">{row.time}</td>
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
