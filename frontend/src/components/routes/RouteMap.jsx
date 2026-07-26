import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom colored-dot markers instead of Leaflet's default icon images —
// avoids the classic "broken marker" bundler issue and matches the
// NexusRoute palette (origin = primary blue, stops = numbered pins).
function stopIcon(label, isOrigin) {
  const bg = isOrigin ? "#3B82F6" : "#161A23";
  const border = isOrigin ? "#1e3a5f" : "#3B82F6";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:#fff;width:26px;height:26px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid ${border};box-shadow:0 1px 4px rgba(0,0,0,.5)">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

/**
 * Renders the origin plus ordered stops on an OpenStreetMap/Leaflet map,
 * connected by a polyline in visiting order. `origin`/`stops` are
 * { label, lat, lng } objects — `stops` must already be in visit order
 * (as returned by the optimizer / a saved Route).
 */
export default function RouteMap({ origin, stops }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
      [origin.lat, origin.lng],
      12
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers/polyline whenever the route changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !origin) return;

    layerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    const points = [origin, ...stops];
    const latlngs = points.map((p) => [p.lat, p.lng]);

    L.polyline(latlngs, { color: "#3B82F6", weight: 4, opacity: 0.8 }).addTo(group);

    points.forEach((p, i) => {
      L.marker([p.lat, p.lng], { icon: stopIcon(i === 0 ? "O" : i, i === 0) })
        .bindPopup(`<strong>${i === 0 ? "Origen" : `Parada ${i}`}</strong><br/>${p.label ?? ""}`)
        .addTo(group);
    });

    if (latlngs.length > 1) {
      map.fitBounds(latlngs, { padding: [40, 40] });
    } else {
      map.setView(latlngs[0], 13);
    }
  }, [origin, stops]);

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-xl border border-nexus-border"
    />
  );
}
