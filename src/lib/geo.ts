export type LatLng = { lat: number; lng: number };

/** Great-circle distance in meters (haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isOutsideZone(pos: LatLng, center: LatLng, radiusM: number): boolean {
  return haversineMeters(pos, center) > radiusM;
}

export const OUTSIDE_GRACE_MS = 30_000;
export const MIN_RADIUS = 100;
export const MAX_RADIUS = 1000;

export const GPS_POOR_ACCURACY_M = 20;

/** True when the GPS fix is too fuzzy (accuracy radius over 20m) — ask the user to step outside. */
export function isPoorAccuracy(accuracyM: number | null | undefined): boolean {
  return accuracyM != null && accuracyM > GPS_POOR_ACCURACY_M;
}

/** True once a player has been continuously outside for longer than the grace period. */
export function isOutsideTooLong(outsideSince: number | null, now: number): boolean {
  return outsideSince !== null && now - outsideSince > OUTSIDE_GRACE_MS;
}
