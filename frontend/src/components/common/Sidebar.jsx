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

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { key: "deliveries", label: "Entregas", Icon: IconBox },
  { key: "vehicles", label: "Vehículos", Icon: IconTruck },
  { key: "routes", label: "Rutas", Icon: IconRoute },
  { key: "reports", label: "Reportes", Icon: IconChart },
];

/**
 * Admin dashboard sidebar. `active` selects the highlighted item.
 * Navigation is wired in Phase 4; for now items are presentational.
 */
export default function Sidebar({ active = "dashboard" }) {
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
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-nexus-primary/15 text-nexus-primary"
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
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-nexus-primary px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
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
