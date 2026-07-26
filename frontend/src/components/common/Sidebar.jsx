import { useNavigate } from "react-router-dom";

import {
  IconBolt,
  IconBox,
  IconChart,
  IconDashboard,
  IconHelp,
  IconPlus,
  IconRoute,
  IconSettings,
  IconTruck,
} from "./icons.jsx";

// `to` links to an existing route; items without it are not navigable yet
// (their pages arrive in later phases).
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: IconDashboard, to: "/admin" },
  { key: "deliveries", label: "Entregas", Icon: IconBox, to: "/admin/deliveries" },
  { key: "vehicles", label: "Vehículos", Icon: IconTruck, to: "/admin/vehicles" },
  { key: "routes", label: "Rutas", Icon: IconRoute, to: "/admin/routes" },
  { key: "reports", label: "Reportes", Icon: IconChart, to: "/admin/reports" },
];

/**
 * Admin dashboard sidebar. `active` selects the highlighted item.
 * Items with a `to` navigate; the rest are placeholders for later phases.
 */
export default function Sidebar({ active = "dashboard" }) {
  const navigate = useNavigate();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-nexus-border bg-nexus-surface">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexus-primary text-white">
          <IconBolt width={18} height={18} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">NexusRoute</p>
          <p className="text-[11px] leading-tight text-slate-500">Fleet Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ key, label, Icon, to }) => {
          const isActive = key === active;
          const disabled = !to;
          return (
            <button
              key={key}
              onClick={() => to && navigate(to)}
              disabled={disabled}
              title={disabled ? "Disponible en una fase próxima" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-nexus-primary/15 text-nexus-primary"
                  : disabled
                    ? "cursor-not-allowed text-slate-600"
                    : "text-slate-400 hover:bg-nexus-surface2 hover:text-slate-200"
              }`}
            >
              <Icon width={18} height={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* New route CTA */}
      <div className="px-3 py-2">
        <button
          onClick={() => navigate("/admin/routes")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-nexus-primary px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <IconPlus width={16} height={16} />
          Nueva Ruta
        </button>
      </div>

      {/* Footer */}
      <div className="space-y-1 border-t border-nexus-border px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200">
          <IconSettings width={18} height={18} />
          Configuración
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200">
          <IconHelp width={18} height={18} />
          Soporte
        </button>
      </div>
    </aside>
  );
}
