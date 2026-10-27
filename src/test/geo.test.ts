import { describe, it, expect } from "vitest";
import { haversineMeters, isOutsideZone, isOutsideTooLong, isPoorAccuracy } from "@/lib/geo";

const c = { lat: 0, lng: 0 };
// ~0.001 deg lat ≈ 111m
describe("zone rules", () => {
  it("measures distance", () => {
    expect(Math.round(haversineMeters(c, { lat: 0.001, lng: 0 }))).toBe(111);
  });
  it("player 111m away is outside a 100m zone, inside a 200m zone", () => {
    expect(isOutsideZone({ lat: 0.001, lng: 0 }, c, 100)).toBe(true);
    expect(isOutsideZone({ lat: 0.001, lng: 0 }, c, 200)).toBe(false);
  });
  it("flags only after more than 30 seconds outside", () => {
    expect(isOutsideTooLong(0, 30_000)).toBe(false);
    expect(isOutsideTooLong(0, 30_001)).toBe(true);
    expect(isOutsideTooLong(null, 99_999)).toBe(false);
  });
  it("warns about weak GPS only when accuracy is worse than 20m", () => {
    expect(isPoorAccuracy(20)).toBe(false);
    expect(isPoorAccuracy(20.1)).toBe(true);
    expect(isPoorAccuracy(null)).toBe(false);
  });
});
