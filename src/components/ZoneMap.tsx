import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";

function Recenter({ pos }: { pos: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([pos.lat, pos.lng], map.getZoom());
  }, [pos.lat, pos.lng, map]);
  return null;
}

export default function ZoneMap({
  me,
  center,
  radius,
  outside,
}: {
  me: LatLng;
  center: LatLng;
  radius: number;
  outside: boolean;
}) {
  const styles = getComputedStyle(document.documentElement);
  const red = styles.getPropertyValue("--primary").trim() || "red";
  const ink = styles.getPropertyValue("--foreground").trim() || "black";
  return (
    <MapContainer center={[me.lat, me.lng]} zoom={16} zoomControl={false} className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <Recenter pos={me} />
      <Circle
        center={[center.lat, center.lng]}
        radius={radius}
        pathOptions={{ color: red, fillColor: red, fillOpacity: 0.15, weight: 4 }}
      />
      <CircleMarker
        center={[me.lat, me.lng]}
        radius={9}
        pathOptions={{ color: ink, fillColor: outside ? red : ink, fillOpacity: 1, weight: 3 }}
      />
    </MapContainer>
  );
}
