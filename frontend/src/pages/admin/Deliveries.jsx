import { useState } from "react";
import { useDispatch } from "react-redux";

import Sidebar from "../../components/common/Sidebar.jsx";
import DeliveryForm from "../../components/deliveries/DeliveryForm.jsx";
import DeliveryStatusBadge from "../../components/deliveries/DeliveryStatusBadge.jsx";
import { IconPlus } from "../../components/common/icons.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useDeliveries } from "../../hooks/useDeliveries.js";
import { addDelivery, removeDelivery } from "../../store/deliveriesSlice.js";
import { formatTime } from "../../utils/formatters.js";

export default function Deliveries() {
  const dispatch = useDispatch();
  const { logout } = useAuth();
  const { deliveries, loading, error, reload } = useDeliveries();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(payload) {
    setSubmitting(true);
    const result = await dispatch(addDelivery(payload));
    setSubmitting(false);
    if (addDelivery.fulfilled.match(result)) {
      setShowForm(false);
      reload();
    }
  }

  function handleDelete(id) {
    if (window.confirm("¿Eliminar esta entrega?")) {
      dispatch(removeDelivery(id));
    }
  }

  return (
    <div className="flex min-h-screen bg-nexus-navy text-slate-200">
      <Sidebar active="deliveries" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-nexus-border px-8 py-4">
          <h1 className="text-lg font-semibold text-white">Entregas</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-nexus-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <IconPlus width={16} height={16} />
              Nueva Entrega
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
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Destino</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Creada</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        Cargando...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-red-400">
                        No se pudieron cargar las entregas.
                      </td>
                    </tr>
                  )}
                  {!loading && !error && deliveries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        Aún no hay entregas. Creá la primera con “Nueva Entrega”.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    deliveries.map((d) => (
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
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(d.id)}
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
        <DeliveryForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
