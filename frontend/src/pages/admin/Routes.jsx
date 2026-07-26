import { useEffect, useState } from "react";

import Sidebar from "../../components/common/Sidebar.jsx";
import RouteMap from "../../components/routes/RouteMap.jsx";
import RouteDetail from "../../components/routes/RouteDetail.jsx";
import { fetchDrivers } from "../../api/users.js";
import { createRoute, fetchRoutes } from "../../api/routes.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useDeliveries } from "../../hooks/useDeliveries.js";
import { useVehicles } from "../../hooks/useVehicles.js";

export default function Routes() {
  const { logout } = useAuth();
  const {
    deliveries,
    loading: loadingDeliveries,
    reload: reloadDeliveries,
  } = useDeliveries({ status: "PENDING" });
  const { vehicles } = useVehicles({ is_active: true });

  const [drivers, setDrivers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [pastRoutes, setPastRoutes] = useState([]);

  // A delivery already carrying a driver is on some other route already.
  const unassigned = deliveries.filter((d) => !d.driver);

  useEffect(() => {
    fetchDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]));
  }, []);

  useEffect(() => {
    fetchRoutes()
      .then((data) => setPastRoutes(data.results ?? data))
      .catch(() => {});
  }, [activeRoute]);

  function toggleDelivery(id) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function handleAssign(e) {
    e.preventDefault();
    if (!driverId || !vehicleId || selectedIds.length === 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const route = await createRoute({
        driver: Number(driverId),
        vehicle: Number(vehicleId),
        delivery_ids: selectedIds,
      });
      setActiveRoute(route);
      setSelectedIds([]);
      reloadDeliveries();
    } catch (err) {
      const data = err.response?.data;
      setFormError(data?.delivery_ids || data?.detail || "No se pudo crear la ruta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-nexus-navy text-slate-200">
      <Sidebar active="routes" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-nexus-border px-8 py-4">
          <h1 className="text-lg font-semibold text-white">Rutas</h1>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400">
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            {/* Assignment form */}
            <form
              onSubmit={handleAssign}
              className="space-y-4 rounded-xl border border-nexus-border bg-nexus-surface p-5 xl:col-span-2"
            >
              <h2 className="text-base font-semibold text-white">Nueva Ruta</h2>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Conductor</span>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-nexus-border bg-nexus-surface2 px-3 py-2 text-sm text-white outline-none focus:border-nexus-primary"
                >
                  <option value="">Seleccionar...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.first_name || d.username}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Vehículo</span>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-nexus-border bg-nexus-surface2 px-3 py-2 text-sm text-white outline-none focus:border-nexus-primary"
                >
                  <option value="">Seleccionar...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.model || v.vehicle_type})
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-2 block text-sm text-slate-300">
                  Entregas pendientes ({selectedIds.length} seleccionadas)
                </span>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-nexus-border p-2">
                  {loadingDeliveries && (
                    <p className="p-2 text-xs text-slate-500">Cargando...</p>
                  )}
                  {!loadingDeliveries && unassigned.length === 0 && (
                    <p className="p-2 text-xs text-slate-500">
                      No hay entregas pendientes sin asignar.
                    </p>
                  )}
                  {unassigned.map((d) => (
                    <label
                      key={d.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-nexus-surface2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(d.id)}
                        onChange={() => toggleDelivery(d.id)}
                        className="accent-nexus-primary"
                      />
                      <span className="font-mono text-xs text-slate-500">
                        {d.package?.tracking_code}
                      </span>
                      <span className="truncate text-slate-300">
                        {d.package?.destination_address}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {String(formError)}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !driverId || !vehicleId || selectedIds.length === 0}
                className="w-full rounded-lg bg-nexus-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Optimizando..." : "Optimizar y Asignar Ruta"}
              </button>
            </form>

            {/* Map + explainable detail */}
            <div className="space-y-4 xl:col-span-3">
              {activeRoute ? (
                <>
                  <RouteMap
                    origin={{
                      label: activeRoute.origin_label,
                      lat: activeRoute.origin_lat,
                      lng: activeRoute.origin_lng,
                    }}
                    stops={activeRoute.stops.map((s) => ({
                      label: s.client_name,
                      lat: s.lat,
                      lng: s.lng,
                    }))}
                  />
                  <RouteDetail route={activeRoute} />
                </>
              ) : (
                <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-nexus-border text-sm text-slate-500">
                  Armá una ruta para verla en el mapa.
                </div>
              )}
            </div>
          </div>

          {/* Past routes */}
          <div className="mt-8 rounded-xl border border-nexus-border bg-nexus-surface">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-white">Rutas Asignadas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-nexus-border text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Conductor</th>
                    <th className="px-5 py-3 font-medium">Vehículo</th>
                    <th className="px-5 py-3 font-medium">Paradas</th>
                    <th className="px-5 py-3 font-medium">Distancia</th>
                    <th className="px-5 py-3 font-medium">Tiempo est.</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pastRoutes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        Aún no hay rutas asignadas.
                      </td>
                    </tr>
                  )}
                  {pastRoutes.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-nexus-border/60 last:border-0 hover:bg-nexus-surface2/50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">#{r.id}</td>
                      <td className="px-5 py-3 text-white">{r.driver_name}</td>
                      <td className="px-5 py-3 text-slate-400">{r.vehicle_plate}</td>
                      <td className="px-5 py-3 text-slate-400">{r.stops.length}</td>
                      <td className="px-5 py-3 text-slate-400">{r.total_distance_km} km</td>
                      <td className="px-5 py-3 text-slate-400">{r.estimated_time_min} min</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setActiveRoute(r)}
                          className="text-xs text-nexus-primary hover:underline"
                        >
                          Ver en mapa
                        </button>
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
