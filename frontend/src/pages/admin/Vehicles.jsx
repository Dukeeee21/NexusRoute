import { useState } from "react";

import Sidebar from "../../components/common/Sidebar.jsx";
import VehicleForm from "../../components/vehicles/VehicleForm.jsx";
import { IconPlus } from "../../components/common/icons.jsx";
import { createVehicle, deleteVehicle } from "../../api/vehicles.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useVehicles } from "../../hooks/useVehicles.js";

const TYPE_LABELS = { VAN: "Furgoneta", TRUCK: "Camión", MOTORCYCLE: "Motocicleta" };

export default function Vehicles() {
  const { logout } = useAuth();
  const { vehicles, loading, error, reload } = useVehicles();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      await createVehicle(payload);
      setShowForm(false);
      reload();
    } catch {
      // Errores de validación quedan visibles vía el estado `error` del hook
      // en un reload posterior; aquí solo evitamos que la promesa cuelgue.
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm("¿Eliminar este vehículo?")) {
      await deleteVehicle(id);
      reload();
    }
  }

  return (
    <div className="flex min-h-screen bg-nexus-navy text-slate-200">
      <Sidebar active="vehicles" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-nexus-border px-8 py-4">
          <h1 className="text-lg font-semibold text-white">Vehículos</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-nexus-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <IconPlus width={16} height={16} />
              Nuevo Vehículo
            </button>
            <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400">
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="rounded-xl border border-nexus-border bg-nexus-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-nexus-border text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-medium">Placa</th>
                    <th className="px-5 py-3 font-medium">Modelo</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Capacidad</th>
                    <th className="px-5 py-3 font-medium">Conductor</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        Cargando...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-red-400">
                        No se pudieron cargar los vehículos.
                      </td>
                    </tr>
                  )}
                  {!loading && !error && vehicles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        Aún no hay vehículos. Creá el primero con "Nuevo Vehículo".
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    vehicles.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-nexus-border/60 last:border-0 hover:bg-nexus-surface2/50"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-white">{v.plate}</td>
                        <td className="px-5 py-3 text-slate-400">{v.model || "—"}</td>
                        <td className="px-5 py-3 text-slate-400">
                          {TYPE_LABELS[v.vehicle_type] || v.vehicle_type}
                        </td>
                        <td className="px-5 py-3 text-slate-400">{v.capacity_kg} kg</td>
                        <td className="px-5 py-3 text-slate-400">{v.driver_name || "Sin asignar"}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              v.is_active
                                ? "bg-status-delivered/15 text-status-delivered"
                                : "bg-status-pending/15 text-status-pending"
                            }`}
                          >
                            {v.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-xs text-slate-500 hover:text-red-400"
                          >
                            Eliminar
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

      {showForm && (
        <VehicleForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
