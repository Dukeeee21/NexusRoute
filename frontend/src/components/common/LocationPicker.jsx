import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="background:#3B82F6;width:22px;height:22px;border-radius:9999px 9999px 9999px 0;transform:rotate(45deg);border:2px solid #0F1117;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

/**
 * Click-anywhere-on-the-map location picker. Replaces raw "Lat"/"Lng"
 * number inputs — which nobody has memorized for a given address —
 * with something a dispatcher can actually use: click (or drag the
 * pin) to set the point, see it confirmed visually.
 *
 * `lat`/`lng` are the current value (null until set). `defaultCenter`
 * is only used to frame the initial view before a point is chosen.
 */
export default function LocationPicker({ lat, lng, onChange, defaultCenter }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the map once; re-created only if the container is remounted.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start = lat != null && lng != null ? [lat, lng] : [defaultCenter.lat, defaultCenter.lng];

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(start, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => {
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync with the current value.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (lat == null || lng == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ lat: pos.lat, lng: pos.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    map.panTo([lat, lng]);
  }, [lat, lng]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-52 w-full overflow-hidden rounded-lg border border-nexus-border"
      />
      {lat == null && (
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
          <span className="rounded-full bg-nexus-navy/90 px-3 py-1 text-xs text-slate-300 shadow">
            Hacé clic en el mapa para marcar el punto
          </span>
        </div>
      )}
    </div>
  );
}
