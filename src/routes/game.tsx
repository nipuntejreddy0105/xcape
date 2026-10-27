import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { isOutsideTooLong, isOutsideZone, isPoorAccuracy, MAX_RADIUS, MIN_RADIUS, type LatLng } from "@/lib/geo";
import {
  canTag,
  fmtClock,
  msToNextPing,
  msToNextSqueeze,
  phaseAt,
  pingAgeLabel,
  pingIndex,
  zoneRadiusAt,
  type Role,
} from "@/lib/game";
import type { MapMarker } from "@/components/ZoneMap";
import { alertPulse, primeAudio, useWakeLock } from "@/lib/alerts";

const ZoneMap = lazy(() => import("@/components/ZoneMap"));

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Game — SCRAM" },
      { name: "description", content: "Lobby, head start, hunt and squeeze in a live SCRAM round." },
      { property: "og:title", content: "Game — SCRAM" },
      { property: "og:description", content: "Lobby, head start, hunt and squeeze in a live SCRAM round." },
    ],
  }),
  component: GameScreen,
});

type Player = {
  id: string;
  name: string;
  role: Role;
  isMe?: boolean;
  pos?: LatLng | undefined;
  ping?: { lat: number; lng: number; at: number } | undefined;
  tagged?: boolean;
};

const DEMO_NAMES = ["Ava", "Kai", "Rio", "Zed"];

function GameScreen() {
  const [stage, setStage] = useState<"lobby" | "playing" | "over">("lobby");
  const [me, setMe] = useState<LatLng | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>(() => [
    { id: "me", name: "You", role: "hunter", isMe: true },
    ...DEMO_NAMES.map((n, i) => ({ id: n, name: n, role: (i < 1 ? "hunter" : "runner") as Role })),
  ]);
  const [initialRadius, setInitialRadius] = useState(300);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const outsideSince = useRef<number | null>(null);

  // Live GPS
  useEffect(() => {
    if (!navigator.geolocation) return setGpsError("GPS isn't available on this device.");
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude });
        setAccuracy(p.coords.accuracy ?? null);
      },
      (e) => setGpsError(e.message || "Allow location access to play."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Clock + demo players wandering (stand-in until players sync between phones)
  useEffect(() => {
    if (stage !== "playing") return;
    const t = setInterval(() => {
      setNow(Date.now());
      setPlayers((ps) =>
        ps.map((p) =>
          p.isMe || !p.pos || p.tagged
            ? p
            : { ...p, pos: { lat: p.pos.lat + (Math.random() - 0.5) * 0.00008, lng: p.pos.lng + (Math.random() - 0.5) * 0.00008 } },
        ),
      );
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  const myRole = players.find((p) => p.isMe)!.role;
  const poorGps = isPoorAccuracy(accuracy);
  const { phase, msLeft } = phaseAt(startedAt, now);
  const radius = zoneRadiusAt(initialRadius, startedAt, now);
  const ping = stage === "playing" ? pingIndex(startedAt, now) : 0;

  // Ping snapshot every 2 minutes of the hunt
  useEffect(() => {
    if (stage !== "playing" || ping === 0) return;
    const at = Date.now();
    setPlayers((ps) =>
      ps.map((p) => (p.role === "runner" && !p.tagged && (p.isMe ? me : p.pos) ? { ...p, ping: { ...(p.isMe ? me! : p.pos!), at } } : p)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ping, stage]);

  // Keep screen on during a match
  useWakeLock(stage === "playing");

  // Beep + buzz on each new ping
  useEffect(() => {
    if (stage === "playing" && ping > 0) alertPulse();
  }, [ping, stage]);

  // Beep + buzz whenever someone is tagged out
  const taggedCount = players.filter((p) => p.tagged).length;
  const prevTagged = useRef(0);
  useEffect(() => {
    if (taggedCount > prevTagged.current) alertPulse();
    prevTagged.current = taggedCount;
  }, [taggedCount]);

  // End when every runner is tagged
  useEffect(() => {
    if (stage === "playing" && players.filter((p) => p.role === "runner").every((p) => p.tagged)) setStage("over");
  }, [players, stage]);

  function startGame() {
    if (!me) return;
    primeAudio();
    const c = me;
    setCenter(c);
    setPlayers((ps) =>
      ps.map((p) => ({
        ...p,
        tagged: false,
        ping: undefined,
        pos: p.isMe ? undefined : { lat: c.lat + (Math.random() - 0.5) * 0.002, lng: c.lng + (Math.random() - 0.5) * 0.002 },
      })),
    );
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
    setStage("playing");
  }

  if (stage === "lobby")
    return (
      <Lobby
        players={players}
        setRole={(id, role) => setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, role } : p)))}
        radius={initialRadius}
        setRadius={setInitialRadius}
        ready={!!me}
        gpsError={gpsError}
        poorGps={poorGps}
        onStart={startGame}
      />
    );

  if (stage === "over")
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-primary p-6 text-primary-foreground">
        <h1 className="font-display text-6xl uppercase leading-none">Hunters win</h1>
        <p className="text-lg font-semibold">Every runner was tagged in {fmtClock(now - startedAt)}.</p>
        <button onClick={() => setStage("lobby")} className="brutal-card py-5 font-display text-2xl uppercase">
          Back to lobby
        </button>
      </main>
    );

  // Playing
  const outsideNow = !!(me && center && isOutsideZone(me, center, radius));
  if (outsideNow && outsideSince.current === null) outsideSince.current = now;
  if (!outsideNow) outsideSince.current = null;
  const flagged = isOutsideTooLong(outsideSince.current, now);

  const others = players.filter((p) => !p.isMe);
  const markers: MapMarker[] =
    myRole === "hunter"
      ? [
          ...others.filter((p) => p.role === "hunter" && p.pos).map((p) => ({ id: p.id, ...p.pos!, label: p.name, kind: "hunter" as const })),
          ...others
            .filter((p) => p.role === "runner" && p.ping && !p.tagged)
            .map((p) => ({ id: p.id, lat: p.ping!.lat, lng: p.ping!.lng, label: `Ghost / ${p.name} ${pingAgeLabel(p.ping!.at, now)}`, kind: "ghost" as const })),
        ]
      : others.filter((p) => p.role === "hunter" && p.pos).map((p) => ({ id: p.id, ...p.pos!, label: p.name, kind: "hunter" as const }));

  const taggable =
    myRole === "hunter" && phase === "hunt" && me
      ? others.find((p) => p.role === "runner" && !p.tagged && p.pos && canTag(me, p.pos))
      : undefined;

  const runnersLeft = players.filter((p) => p.role === "runner" && !p.tagged).length;
  const holdTight = myRole === "hunter" && phase === "head_start";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        {me && center && !holdTight && (
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <ZoneMap me={me} center={center} radius={radius} outside={outsideNow} markers={markers} />
            </Suspense>
          </ClientOnly>
        )}
      </div>

      {holdTight && (
        <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-6 bg-foreground p-8 text-center text-background">
          <p className="font-display text-4xl uppercase leading-tight">Hunters hold tight while runners scatter</p>
          <p className="font-display text-8xl text-primary">{fmtClock(msLeft)}</p>
        </div>
      )}

      <div className="absolute inset-x-3 top-3 z-[1000] flex items-start justify-between gap-2">
        <div className="brutal-card px-3 py-2">
          <p className="font-display text-xs uppercase">{myRole === "hunter" ? "Hunter" : "Runner"}</p>
          <p className="font-display text-2xl leading-none">
            {phase === "head_start" ? fmtClock(msLeft) : `${runnersLeft} left`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {phase === "hunt" && (
            <span className="brutal-card px-3 py-2 font-display text-sm uppercase">
              Ping {fmtClock(msToNextPing(startedAt, now))} · Squeeze {fmtClock(msToNextSqueeze(startedAt, now))}
            </span>
          )}
          {phase === "head_start" && myRole === "runner" && (
            <span className="brutal-card-dark px-3 py-2 font-display text-sm uppercase">Scatter!</span>
          )}
          {poorGps && (
            <span className="brutal-card px-3 py-2 font-display text-xs uppercase text-primary">
              Weak GPS signal — step outside
            </span>
          )}
          {flagged && (
            <span className="warn-flash rounded-md border-4 border-foreground px-3 py-2 font-display uppercase">⚠ Outside zone</span>
          )}
        </div>
      </div>

      <div className="absolute inset-x-3 bottom-4 z-[1000] flex flex-col gap-3">
        {taggable && (
          <button
            onClick={() => setPlayers((ps) => ps.map((p) => (p.id === taggable.id ? { ...p, tagged: true } : p)))}
            className="warn-flash rounded-lg border-4 border-foreground py-8 font-display text-4xl uppercase shadow-[var(--shadow-brutal)]"
          >
            Tag {taggable.name}
          </button>
        )}
        <div className="brutal-card flex items-center justify-between px-4 py-3">
          <span className="font-display uppercase">Zone {Math.round(radius)}m</span>
          <Link to="/" className="font-display uppercase text-primary">Quit</Link>
        </div>
      </div>
    </div>
  );
}

function Lobby({
  players,
  setRole,
  radius,
  setRadius,
  ready,
  gpsError,
  poorGps,
  onStart,
}: {
  players: Player[];
  setRole: (id: string, r: Role) => void;
  radius: number;
  setRadius: (n: number) => void;
  ready: boolean;
  gpsError: string | null;
  poorGps: boolean;
  onStart: () => void;
}) {
  const hunters = players.filter((p) => p.role === "hunter").length;
  const runners = players.length - hunters;
  const valid = hunters > 0 && runners > 0;
  const counts = useMemo(() => `${hunters} hunters · ${runners} runners`, [hunters, runners]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 bg-background p-5">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-display uppercase">← Back</Link>
        <span className="font-display uppercase text-primary">Lobby</span>
      </div>
      <h1 className="font-display text-5xl uppercase leading-none">Pick roles</h1>
      <p className="font-semibold text-muted-foreground">{counts}</p>
      <ul className="flex flex-col gap-3">
        {players.map((p) => (
          <li key={p.id} className="brutal-card flex items-center justify-between px-4 py-3">
            <span className="font-display text-xl uppercase">{p.name}</span>
            <div className="flex overflow-hidden rounded-md border-4 border-foreground">
              {(["hunter", "runner"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(p.id, r)}
                  className={`px-3 py-1 font-display text-sm uppercase ${p.role === r ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="brutal-card p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-display uppercase">Starting zone</span>
          <span className="font-display text-2xl text-primary">{radius}m</span>
        </div>
        <input type="range" min={MIN_RADIUS} max={MAX_RADIUS} step={10} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="zone-slider w-full" aria-label="Zone radius" />
      </div>
      <button
        disabled={!ready || !valid}
        onClick={onStart}
        className="brutal-card-dark mt-auto py-5 font-display text-3xl uppercase disabled:opacity-40"
      >
        {gpsError ? "Allow location" : !ready ? "Finding you…" : !valid ? "Need both roles" : "Start game"}
      </button>
    </main>
  );
}

