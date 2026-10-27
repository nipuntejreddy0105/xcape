import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  isOutsideTooLong,
  isOutsideZone,
  MAX_RADIUS,
  MIN_RADIUS,
  type LatLng,
} from "@/lib/geo";

const ZoneMap = lazy(() => import("@/components/ZoneMap"));

export const Route = createFileRoute("/map")({
  validateSearch: z.object({ role: z.enum(["host", "player"]).catch("host") }),
  head: () => ({
    meta: [
      { title: "The Zone — SCRAM" },
      { name: "description", content: "Live GPS map of the SCRAM play zone." },
      { property: "og:title", content: "The Zone — SCRAM" },
      { property: "og:description", content: "Live GPS map of the SCRAM play zone." },
    ],
  }),
  component: MapScreen,
});

function MapScreen() {
  const { role } = Route.useSearch();
  const isHost = role === "host";
  const [me, setMe] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(300);
  const [now, setNow] = useState(() => Date.now());
  const outsideSince = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("GPS isn't available on this device.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(pos);
        // Host's zone follows the host; player zone is fixed at first fix until synced.
        setCenter((c) => (isHost || !c ? pos : c));
      },
      (e) => setError(e.message || "Allow location access to play."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      navigator.geolocation.clearWatch(id);
      clearInterval(t);
    };
  }, [isHost]);

  const outsideNow = !!(me && center && isOutsideZone(me, center, radius));
  if (outsideNow && outsideSince.current === null) outsideSince.current = now;
  if (!outsideNow) outsideSince.current = null;
  const flagged = isOutsideTooLong(outsideSince.current, now);
  const secsOut = outsideSince.current ? Math.floor((now - outsideSince.current) / 1000) : 0;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        {me && center ? (
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <ZoneMap me={me} center={center} radius={radius} outside={outsideNow} />
            </Suspense>
          </ClientOnly>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="font-display text-2xl uppercase">{error ?? "Finding you…"}</p>
          </div>
        )}
      </div>

      <div className="absolute inset-x-3 top-3 z-[1000] flex items-start justify-between gap-2">
        <Link to="/" className="brutal-card px-4 py-2 font-display uppercase">← Back</Link>
        <div className="flex flex-col items-end gap-2">
          <span className="brutal-card px-3 py-2 font-display text-sm uppercase">
            {isHost ? "Host" : "Player"}
          </span>
          {flagged ? (
            <span className="warn-flash rounded-md border-4 border-foreground px-3 py-2 font-display uppercase">
              ⚠ Outside zone
            </span>
          ) : outsideNow ? (
            <span className="brutal-card px-3 py-2 font-display text-sm uppercase text-primary">
              Get back in · {30 - secsOut}s
            </span>
          ) : null}
        </div>
      </div>

      {isHost && (
        <div className="brutal-card absolute inset-x-3 bottom-4 z-[1000] p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-display text-lg uppercase">The Zone</span>
            <span className="font-display text-3xl text-primary">{radius}m</span>
          </div>
          <input
            type="range"
            min={MIN_RADIUS}
            max={MAX_RADIUS}
            step={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="zone-slider w-full"
            aria-label="Zone radius"
          />
        </div>
      )}
    </div>
  );
}
