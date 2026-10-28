// Browser-safe Xcape rules shared by screens and server actions.
export const MAX_PLAYERS = 15;
export const HOST_CODE_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeHostCode(rand: () => number = Math.random) {
  let code = "";
  for (let i = 0; i < HOST_CODE_LENGTH; i++) code += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
  return code;
}

export const normalizeCode = (raw: string) => raw.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, HOST_CODE_LENGTH);

export const normalizeUsername = (raw: string) => raw.trim().toLowerCase();

export function usernameError(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (!u.startsWith("@")) return "Usernames start with @";
  if (!/^@[a-z0-9_]{3,20}$/.test(u)) return "Use 3–20 letters, numbers or _ after the @";
  return null;
}

export const isRoomFull = (playerCount: number) => playerCount >= MAX_PLAYERS;

export type Role = "hunter" | "runner";

/** Randomly pick `hunters` hunters (at least 1, leaving at least 1 runner when possible). */
export function assignRoles<T>(ids: T[], hunters: number, rand: () => number = Math.random): { id: T; role: Role }[] {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  const count = Math.max(1, Math.min(hunters, Math.max(1, ids.length - 1)));
  return shuffled.map((id, i) => ({ id, role: i < count ? "hunter" : "runner" }));
}

export const RULES = {
  round_length_min: { label: "Round length", min: 10, max: 120, step: 5, fallback: 30 },
  ping_interval_min: { label: "Pings", min: 1, max: 10, step: 1, fallback: 2 },
  headstart_min: { label: "Head start", min: 1, max: 10, step: 1, fallback: 3 },
  initial_radius_m: { label: "Zone size", min: 100, max: 1000, step: 20, fallback: 420 },
  shrink_interval_min: { label: "Zone shrinks every", min: 1, max: 15, step: 1, fallback: 5 },
  min_radius_m: { label: "Shrinks down to", min: 50, max: 500, step: 10, fallback: 150 },
  hunter_count: { label: "Hunters", min: 1, max: 7, step: 1, fallback: 2 },
} as const;
export type RuleKey = keyof typeof RULES;

export function clampRule(key: RuleKey, value: number) {
  const r = RULES[key];
  return Math.min(r.max, Math.max(r.min, Math.round(value / r.step) * r.step));
}

export function fmtDistance(meters: number, units: string | null | undefined) {
  if (units === "mi") return meters >= 1609 ? `${(meters / 1609.34).toFixed(1)} mi` : `${Math.round(meters * 3.28084)} ft`;
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

export function fmtDuration(sec: number | null | undefined) {
  const s = Math.max(0, sec ?? 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
