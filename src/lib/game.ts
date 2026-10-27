import { haversineMeters, type LatLng } from "./geo";

export const HEAD_START_MS = 3 * 60_000;
export const PING_INTERVAL_MS = 2 * 60_000;
export const SQUEEZE_INTERVAL_MS = 5 * 60_000;
export const SQUEEZE_FACTOR = 0.85; // shrink by 15%
export const TAG_DISTANCE_M = 5;

export type Role = "hunter" | "runner";
export type Phase = "head_start" | "hunt";

export function phaseAt(startedAt: number, now: number): { phase: Phase; msLeft: number } {
  const t = now - startedAt;
  if (t < HEAD_START_MS) return { phase: "head_start", msLeft: HEAD_START_MS - t };
  return { phase: "hunt", msLeft: 0 };
}

/** ms since the hunt began (0 during head start). */
export function huntElapsed(startedAt: number, now: number): number {
  return Math.max(0, now - startedAt - HEAD_START_MS);
}

/** Number of completed pings since the hunt began. */
export function pingIndex(startedAt: number, now: number): number {
  return Math.floor(huntElapsed(startedAt, now) / PING_INTERVAL_MS);
}

export function msToNextPing(startedAt: number, now: number): number {
  return PING_INTERVAL_MS - (huntElapsed(startedAt, now) % PING_INTERVAL_MS);
}

export function squeezeCount(startedAt: number, now: number): number {
  return Math.floor(huntElapsed(startedAt, now) / SQUEEZE_INTERVAL_MS);
}

export function zoneRadiusAt(initial: number, startedAt: number, now: number): number {
  return initial * SQUEEZE_FACTOR ** squeezeCount(startedAt, now);
}

export function msToNextSqueeze(startedAt: number, now: number): number {
  return SQUEEZE_INTERVAL_MS - (huntElapsed(startedAt, now) % SQUEEZE_INTERVAL_MS);
}

export function canTag(hunter: LatLng, runner: LatLng): boolean {
  return haversineMeters(hunter, runner) <= TAG_DISTANCE_M;
}

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function pingAgeLabel(pingAt: number, now: number): string {
  const s = Math.floor((now - pingAt) / 1000);
  if (s < 60) return "just now";
  return `${Math.floor(s / 60)}m ago`;
}
