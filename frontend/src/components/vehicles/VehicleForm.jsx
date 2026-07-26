import { useState } from "react";

const EMPTY = { plate: "", model: "", vehicle_type: "VAN", capacity_kg: "" };

const labelCls = "mb-1 block text-slate-300";
const inputCls =
  "w-full rounded-lg border border-nexus-border bg-nexus-surface2 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-nexus-primary";

export default function VehicleForm({ onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      plate: form.plate,
      model: form.model,
      vehicle_type: form.vehicle_type,
      capacity_kg: form.capacity_kg || 0,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-nexus-border bg-nexus-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Nuevo Vehículo</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className={labelCls}>Placa</span>
            <input value={form.plate} onChange={set("plate")} required className={inputCls} />
          </label>

          <label className="block text-sm">
            <span className={labelCls}>Modelo</span>
            <input value={form.model} onChange={set("model")} className={inputCls} />
          </label>

          <label className="block text-sm">
            <span className={labelCls}>Tipo</span>
            <select value={form.vehicle_type} onChange={set("vehicle_type")} className={inputCls}>
              <option value="VAN">Furgoneta</option>
              <option value="TRUCK">Camión</option>
              <option value="MOTORCYCLE">Motocicleta</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className={labelCls}>Capacidad (kg)</span>
            <input
              type="number"
              min="0"
              value={form.capacity_kg}
              onChange={set("capacity_kg")}
              className={inputCls}
            />
          </label>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-nexus-border px-4 py-2 text-sm text-slate-300 hover:bg-nexus-surface2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-nexus-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Crear vehículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
