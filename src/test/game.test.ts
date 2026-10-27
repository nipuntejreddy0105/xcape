import { describe, it, expect } from "vitest";
import { phaseAt, pingIndex, zoneRadiusAt, canTag } from "@/lib/game";

const MIN = 60_000;
describe("game loop rules", () => {
  it("head start lasts 3 minutes", () => {
    expect(phaseAt(0, 3 * MIN - 1).phase).toBe("head_start");
    expect(phaseAt(0, 3 * MIN).phase).toBe("hunt");
  });
  it("pings every 2 minutes of the hunt", () => {
    expect(pingIndex(0, 3 * MIN + 2 * MIN - 1)).toBe(0);
    expect(pingIndex(0, 3 * MIN + 2 * MIN)).toBe(1);
    expect(pingIndex(0, 3 * MIN + 4 * MIN)).toBe(2);
  });
  it("zone shrinks 15% every 5 minutes", () => {
    expect(zoneRadiusAt(1000, 0, 3 * MIN + 5 * MIN - 1)).toBe(1000);
    expect(zoneRadiusAt(1000, 0, 3 * MIN + 5 * MIN)).toBeCloseTo(850);
    expect(zoneRadiusAt(1000, 0, 3 * MIN + 10 * MIN)).toBeCloseTo(722.5);
  });
  it("tag allowed within 5 meters only", () => {
    const a = { lat: 0, lng: 0 };
    expect(canTag(a, { lat: 0.00004, lng: 0 })).toBe(true); // ~4.4m
    expect(canTag(a, { lat: 0.00006, lng: 0 })).toBe(false); // ~6.7m
  });
});
