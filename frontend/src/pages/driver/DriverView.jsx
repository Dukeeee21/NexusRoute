import {
  IconArrowLeft,
  IconClock,
  IconLogout,
  IconMap,
  IconMapPin,
  IconNavigation,
} from "../../components/common/icons.jsx";
import DeliveryStatusBadge from "../../components/deliveries/DeliveryStatusBadge.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { DELIVERY_STATUS } from "../../utils/constants.js";

// Mock route mirroring the Stitch design. Real assigned route + status
// updates arrive in Phase 5 (PATCH /api/deliveries/{id}/status/).
const STOPS = [
  {
    n: 1,
    status: DELIVERY_STATUS.DELIVERED,
    title: "Av. Reforma 123, CDMX",
    detail: "Corporativo Reforma, 123, Piso 5",
    time: "09:15 AM",
    current: false,
  },
  {
    n: 2,
    status: DELIVERY_STATUS.IN_TRANSIT,
    title: "Insurgentes Sur 456, CDMX",
    detail: "Plaza Insurgentes, Local B2",
    time: null,
    current: true,
  },
  {
    n: 3,
    status: DELIVERY_STATUS.PENDING,
    title: "Polanco V Sección, CDMX",
    detail: "Av. Horacio 1234, Planta Baja",
    time: "ETA: 11:30 AM",
    current: false,
  },
  {
    n: 4,
    status: DELIVERY_STATUS.PENDING,
    title: "Santa Fe, CDMX",
    detail: "Av. Santa Fe 987, Torre A, Piso 12",
    time: "ETA: 13:15 PM",
    current: false,
  },
];

const BORDER_BY_STATUS = {
  [DELIVERY_STATUS.DELIVERED]: "border-l-status-delivered",
  [DELIVERY_STATUS.IN_TRANSIT]: "border-l-status-transit",
  [DELIVERY_STATUS.PENDING]: "border-l-status-pending",
};

export default function DriverView() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen justify-center bg-nexus-navy">
      {/* Mobile-width column */}
      <div className="flex w-full max-w-md flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-nexus-border px-4 py-4">
          <button onClick={logout} className="text-slate-400 hover:text-slate-200" aria-label="Salir">
            <IconArrowLeft width={20} height={20} />
          </button>
          <h1 className="text-base font-semibold text-white">Mi Ruta de Hoy</h1>
          <button className="text-slate-400 hover:text-slate-200" aria-label="Ver mapa">
            <IconMap width={20} height={20} />
          </button>
        </header>

        <div className="space-y-4 p-4">
          {/* Progress */}
          <div className="rounded-xl border border-nexus-border bg-nexus-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Progreso de la Ruta</span>
              <span className="text-sm font-semibold text-white">1 / 4 Entregas</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-nexus-surface2">
              <div className="h-full w-1/4 rounded-full bg-status-delivered" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>ETA Fin: 14:30</span>
              <span>Restante: 3h 15m</span>
            </div>
          </div>

          {/* Stops */}
          {STOPS.map((stop) => (
            <div
              key={stop.n}
              className={`rounded-xl border border-nexus-border border-l-4 bg-nexus-surface p-4 ${
                BORDER_BY_STATUS[stop.status]
              } ${stop.current ? "ring-1 ring-status-transit/40" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Parada {stop.n}
                  {stop.current && " · Destino Actual"}
                </span>
                <DeliveryStatusBadge status={stop.status} />
              </div>

              <h3 className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                <IconMapPin width={15} height={15} className="text-slate-500" />
                {stop.title}
              </h3>
              <p className="mt-0.5 pl-5 text-xs text-slate-400">{stop.detail}</p>

              {stop.time && (
                <p className="mt-2 flex items-center gap-1.5 pl-5 text-xs text-slate-500">
                  <IconClock width={13} height={13} />
                  {stop.time}
                </p>
              )}

              {stop.current && (
                <div className="mt-3 flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-nexus-primary py-2 text-xs font-semibold text-white hover:opacity-90">
                    <IconNavigation width={14} height={14} />
                    Navegar
                  </button>
                  <button className="flex-1 rounded-lg border border-nexus-border py-2 text-xs font-semibold text-slate-200 hover:bg-nexus-surface2">
                    Marcar Llegada
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
