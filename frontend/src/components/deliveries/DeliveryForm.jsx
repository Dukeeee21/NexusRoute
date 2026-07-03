import { useState } from "react";

const EMPTY = {
  client_name: "",
  description: "",
  weight_kg: "",
  origin_address: "",
  origin_lat: "",
  origin_lng: "",
  destination_address: "",
  destination_lat: "",
  destination_lng: "",
};

const Field = ({ label, ...props }) => (
  <label className="block text-sm">
    <span className="mb-1 block text-slate-300">{label}</span>
    <input
      {...props}
      className="w-full rounded-lg border border-nexus-border bg-nexus-surface2 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-nexus-primary"
    />
  </label>
);

/**
 * Modal form to create a delivery (with its nested package).
 * `onSubmit` receives the API payload: { package: {...} }.
 */
export default function DeliveryForm({ onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(EMPTY);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      package: {
        client_name: form.client_name,
        description: form.description,
        weight_kg: form.weight_kg || 0,
        origin_address: form.origin_address,
        origin_lat: parseFloat(form.origin_lat),
        origin_lng: parseFloat(form.origin_lng),
        destination_address: form.destination_address,
        destination_lat: parseFloat(form.destination_lat),
        destination_lng: parseFloat(form.destination_lng),
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-nexus-border bg-nexus-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Nueva Entrega</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Cliente" value={form.client_name} onChange={set("client_name")} required />
          <Field label="Descripción" value={form.description} onChange={set("description")} />
          <Field label="Peso (kg)" type="number" step="0.01" value={form.weight_kg} onChange={set("weight_kg")} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Origen" value={form.origin_address} onChange={set("origin_address")} required />
            <Field label="Lat origen" type="number" step="any" value={form.origin_lat} onChange={set("origin_lat")} required />
            <Field label="Lng origen" type="number" step="any" value={form.origin_lng} onChange={set("origin_lng")} required />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Destino" value={form.destination_address} onChange={set("destination_address")} required />
            <Field label="Lat destino" type="number" step="any" value={form.destination_lat} onChange={set("destination_lat")} required />
            <Field label="Lng destino" type="number" step="any" value={form.destination_lng} onChange={set("destination_lng")} required />
          </div>

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
              {submitting ? "Guardando..." : "Crear entrega"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
