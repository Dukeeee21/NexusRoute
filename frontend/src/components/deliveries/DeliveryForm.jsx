import { useEffect, useState } from "react";

import LocationPicker from "../common/LocationPicker.jsx";
import { IconMapPin } from "../common/icons.jsx";
import { fetchDepot } from "../../api/routes.js";

const labelCls = "mb-1 block text-slate-300";
const inputCls =
  "w-full rounded-lg border border-nexus-border bg-nexus-surface2 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-nexus-primary";

const Field = ({ label, ...props }) => (
  <label className="block text-sm">
    <span className={labelCls}>{label}</span>
    <input {...props} className={inputCls} />
  </label>
);

// Framing for the destination map before anything is picked yet — Lima,
// since that's the default depot's city. If the depot fetch succeeds
// this gets replaced by the real depot location anyway.
const FALLBACK_CENTER = { lat: -12.0464, lng: -77.0428 };

/**
 * Modal form to create a delivery (with its nested package).
 *
 * The origin defaults to the configured depot (fetched from the API)
 * since in practice almost every delivery starts there — asking for
 * an address the dispatcher doesn't need to think about, every single
 * time, was the main friction point. A "Cambiar origen" toggle covers
 * the rare case of a different pickup point.
 *
 * The destination no longer asks for raw lat/lng numbers — nobody has
 * those memorized. Instead it's a click-on-the-map picker.
 *
 * `onSubmit` receives the API payload: { package: {...} }.
 */
export default function DeliveryForm({ onSubmit, onClose, submitting }) {
  const [depot, setDepot] = useState(null);
  const [depotError, setDepotError] = useState(false);

  const [client_name, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [weight_kg, setWeightKg] = useState("");

  const [customOrigin, setCustomOrigin] = useState(false);
  const [originAddress, setOriginAddress] = useState("");
  const [originPoint, setOriginPoint] = useState({ lat: null, lng: null });

  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationPoint, setDestinationPoint] = useState({ lat: null, lng: null });

  useEffect(() => {
    fetchDepot()
      .then((d) => {
        setDepot(d);
        setOriginPoint({ lat: d.lat, lng: d.lng });
      })
      .catch(() => setDepotError(true));
  }, []);

  // Manual origin fields render whenever the user asked for them, or the
  // depot fetch itself failed (no default to fall back to either way).
  const usingManualOrigin = customOrigin || depotError;
  const originReady = usingManualOrigin
    ? originAddress && originPoint.lat != null
    : depot != null;
  const destinationReady = destinationAddress && destinationPoint.lat != null;
  const canSubmit = client_name && originReady && destinationReady;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      package: {
        client_name,
        description,
        weight_kg: weight_kg || 0,
        origin_address: usingManualOrigin ? originAddress : depot.label,
        origin_lat: usingManualOrigin ? originPoint.lat : depot.lat,
        origin_lng: usingManualOrigin ? originPoint.lng : depot.lng,
        destination_address: destinationAddress,
        destination_lat: destinationPoint.lat,
        destination_lng: destinationPoint.lng,
      },
    });
  }

  const mapCenter = depot ?? FALLBACK_CENTER;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-nexus-border bg-nexus-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Nueva Entrega</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Cliente"
            value={client_name}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
          <Field
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Field
            label="Peso (kg)"
            type="number"
            step="0.01"
            min="0"
            value={weight_kg}
            onChange={(e) => setWeightKg(e.target.value)}
          />

          {/* Origin — defaults to the depot, hidden by default */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className={labelCls}>Origen</span>
              {!depotError && (
                <button
                  type="button"
                  onClick={() => setCustomOrigin((v) => !v)}
                  className="text-xs text-nexus-primary hover:underline"
                >
                  {customOrigin ? "Usar el depósito" : "Usar otro origen"}
                </button>
              )}
            </div>

            {!usingManualOrigin && (
              <div className="flex items-center gap-2 rounded-lg border border-nexus-border bg-nexus-surface2 px-3 py-2 text-sm text-slate-300">
                <IconMapPin width={15} height={15} className="shrink-0 text-nexus-primary" />
                {depot ? depot.label : "Cargando depósito..."}
              </div>
            )}

            {usingManualOrigin && (
              <div className="space-y-2">
                <input
                  placeholder="Dirección de origen"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  className={inputCls}
                  required
                />
                <LocationPicker
                  lat={originPoint.lat}
                  lng={originPoint.lng}
                  onChange={setOriginPoint}
                  defaultCenter={mapCenter}
                />
              </div>
            )}
          </div>

          {/* Destination — always a manual pick */}
          <div>
            <span className={labelCls}>Destino</span>
            <div className="space-y-2">
              <input
                placeholder="Dirección de destino"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className={inputCls}
                required
              />
              <LocationPicker
                lat={destinationPoint.lat}
                lng={destinationPoint.lng}
                onChange={setDestinationPoint}
                defaultCenter={mapCenter}
              />
              {destinationPoint.lat != null && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <IconMapPin width={12} height={12} />
                  {destinationPoint.lat.toFixed(5)}, {destinationPoint.lng.toFixed(5)}
                </p>
              )}
            </div>
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
              disabled={submitting || !canSubmit}
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
