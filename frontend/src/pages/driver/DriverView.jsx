import { useEffect, useState } from "react";

import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconMap,
  IconMapPin,
  IconNavigation,
} from "../../components/common/icons.jsx";
import DeliveryStatusBadge from "../../components/deliveries/DeliveryStatusBadge.jsx";
import { updateDeliveryStatus } from "../../api/deliveries.js";
import { fetchRoutes } from "../../api/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { DELIVERY_STATUS } from "../../utils/constants.js";

const BORDER_BY_STATUS = {
  [DELIVERY_STATUS.DELIVERED]: "border-l-status-delivered",
  [DELIVERY_STATUS.IN_TRANSIT]: "border-l-status-transit",
  [DELIVERY_STATUS.PENDING]: "border-l-status-pending",
};

// The driver taps through PENDING -> IN_TRANSIT -> DELIVERED one stop
// at a time; only the current (first non-delivered) stop exposes the
// action buttons, so progress reads as a simple linear checklist.
const NEXT_STATUS = {
  [DELIVERY_STATUS.PENDING]: DELIVERY_STATUS.IN_TRANSIT,
  [DELIVERY_STATUS.IN_TRANSIT]: DELIVERY_STATUS.DELIVERED,
};

const NEXT_LABEL = {
  [DELIVERY_STATUS.PENDING]: "Iniciar Entrega",
  [DELIVERY_STATUS.IN_TRANSIT]: "Marcar Entregado",
};

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Lightweight, mobile-first driver screen: today's assigned route (the
 * most recent Route where this user is the driver — the backend already
 * scopes GET /api/routes/ to the caller's own routes) as a checklist of
 * stops. No reports or fleet-wide metrics live here by design.
 */
export default function DriverView() {
  const { logout } = useAuth();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchRoutes();
      const list = data.results ?? data;
      setRoute(list[0] ?? null);
      setError(null);
    } catch {
      setError("No se pudo cargar tu ruta.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stops = route?.stops ?? [];
  const deliveredCount = stops.filter(
    (s) => s.delivery_status === DELIVERY_STATUS.DELIVERED
  ).length;
  const currentStop = stops.find((s) => s.delivery_status !== DELIVERY_STATUS.DELIVERED);
  const progressPct = stops.length ? Math.round((deliveredCount / stops.length) * 100) : 0;

  async function handleAdvance(stop) {
    const next = NEXT_STATUS[stop.delivery_status];
    if (!next) return;
    setUpdatingId(stop.id);
    try {
      await updateDeliveryStatus(stop.delivery, next);
      setRoute((r) => ({
        ...r,
        stops: r.stops.map((s) => (s.id === stop.id ? { ...s, delivery_status: next } : s)),
      }));
    } catch {
      // A manual refresh (`load()`) will resync if this silently fails.
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex min-h-screen justify-center bg-nexus-navy">
      {/* Mobile-width column */}
      <div className="flex w-full max-w-md flex-col">
        <header className="flex items-center justify-between border-b border-nexus-border px-4 py-4">
          <button onClick={logout} className="text-slate-400 hover:text-slate-200" aria-label="Salir">
            <IconArrowLeft width={20} height={20} />
          </button>
          <h1 className="text-base font-semibold text-white">Mi Ruta de Hoy</h1>
          <button
            onClick={load}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Actualizar ruta"
          >
            <IconMap width={20} height={20} />
          </button>
        </header>

        <div className="space-y-4 p-4">
          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">Cargando tu ruta...</p>
          )}
          {!loading && error && (
            <p className="py-8 text-center text-sm text-red-400">{error}</p>
          )}
          {!loading && !error && !route && (
            <p className="py-8 text-center text-sm text-slate-500">
              Todavía no tenés una ruta asignada. Esperá a que el dispatcher te asigne una.
            </p>
          )}

          {!loading && !error && route && (
            <>
              {/* Progress */}
              <div className="rounded-xl border border-nexus-border bg-nexus-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Progreso de la Ruta</span>
                  <span className="text-sm font-semibold text-white">
                    {deliveredCount} / {stops.length} Entregas
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-nexus-surface2">
                  <div
                    className="h-full rounded-full bg-status-delivered transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{route.origin_label}</span>
                  <span>
                    {route.total_distance_km} km · ~{route.estimated_time_min} min
                  </span>
                </div>
              </div>

              {stops.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Tu ruta no tiene paradas.
                </p>
              )}

              {/* Stops */}
              {stops.map((stop) => {
                const isCurrent = currentStop?.id === stop.id;
                const isUpdating = updatingId === stop.id;
                return (
                  <div
                    key={stop.id}
                    className={`rounded-xl border border-nexus-border border-l-4 bg-nexus-surface p-4 ${
                      BORDER_BY_STATUS[stop.delivery_status]
                    } ${isCurrent ? "ring-1 ring-status-transit/40" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Parada {stop.order}
                        {isCurrent && " · Destino Actual"}
                      </span>
                      <DeliveryStatusBadge status={stop.delivery_status} />
                    </div>

                    <h3 className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                      <IconMapPin width={15} height={15} className="text-slate-500" />
                      {stop.destination_address}
                    </h3>
                    <p className="mt-0.5 pl-5 text-xs text-slate-400">{stop.client_name}</p>
                    <p className="mt-2 flex items-center gap-1.5 pl-5 text-xs text-slate-500">
                      <IconClock width={13} height={13} />
                      {stop.distance_from_prev_km} km desde la parada anterior
                    </p>

                    {isCurrent && stop.delivery_status !== DELIVERY_STATUS.DELIVERED && (
                      <div className="mt-3 flex gap-2">
                        <a
                          href={mapsUrl(stop.lat, stop.lng)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-nexus-border py-2 text-xs font-semibold text-slate-200 hover:bg-nexus-surface2"
                        >
                          <IconNavigation width={14} height={14} />
                          Navegar
                        </a>
                        <button
                          onClick={() => handleAdvance(stop)}
                          disabled={isUpdating}
                          className="flex-1 rounded-lg bg-nexus-primary py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {isUpdating ? "Actualizando..." : NEXT_LABEL[stop.delivery_status]}
                        </button>
                      </div>
                    )}

                    {stop.delivery_status === DELIVERY_STATUS.DELIVERED && (
                      <p className="mt-3 flex items-center gap-1.5 pl-5 text-xs text-status-delivered">
                        <IconCheck width={13} height={13} />
                        Entregado
                      </p>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
