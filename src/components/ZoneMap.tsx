import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";

export type MapMarker = LatLng & { id: string; label: string; kind: "hunter" | "ghost" | "runner" };

function Recenter({ pos }: { pos: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng], map.getZoom());
  }, [pos.lat, pos.lng, map]);
  return null;
}

/** Smoothly tween the radius when it changes (used for The Squeeze). */
function useAnimated(target: number, ms = 1500) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - (1 - k) ** 3;
      const cur = a + (target - a) * e;
      from.current = cur;
      setV(cur);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export default function ZoneMap({
  me,
  center,
  radius,
  outside,
  markers = [],
}: {
  me: LatLng;
  center: LatLng;
  radius: number;
  outside: boolean;
  markers?: MapMarker[];
}) {
  const styles = getComputedStyle(document.documentElement);
  const red = styles.getPropertyValue("--primary").trim() || "red";
  const ink = styles.getPropertyValue("--foreground").trim() || "black";
  const paper = styles.getPropertyValue("--background").trim() || "white";
  const r = useAnimated(radius);
  return (
    <MapContainer center={[me.lat, me.lng]} zoom={16} zoomControl={false} className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <Recenter pos={me} />
      <Circle
        center={[center.lat, center.lng]}
        radius={r}
        pathOptions={{ color: red, fillColor: red, fillOpacity: 0.15, weight: 4 }}
      />
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={m.kind === "ghost" ? 11 : 9}
          pathOptions={
            m.kind === "ghost"
              ? { color: ink, fillColor: paper, fillOpacity: 0.6, weight: 3, dashArray: "4 4" }
              : m.kind === "hunter"
                ? { color: ink, fillColor: red, fillOpacity: 1, weight: 3 }
                : { color: ink, fillColor: paper, fillOpacity: 1, weight: 3 }
          }
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="font-display text-xs uppercase">{m.label}</span>
          </Tooltip>
        </CircleMarker>
      ))}
      <CircleMarker
        center={[me.lat, me.lng]}
        radius={9}
        pathOptions={{ color: paper, fillColor: outside ? red : ink, fillOpacity: 1, weight: 3 }}
      >
        <Tooltip permanent direction="bottom" offset={[0, 10]}>
          <span className="font-display text-xs uppercase">You</span>
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
