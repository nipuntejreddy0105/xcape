import { describe, expect, it } from "vitest";
import { assignRoles, isRoomFull, makeHostCode, normalizeCode, usernameError } from "@/lib/xcape";

describe("Xcape rules", () => {
  it("host codes are 6 alphanumeric characters", () => {
    expect(makeHostCode()).toMatch(/^[A-Z0-9]{6}$/);
  });
  it("usernames must start with @", () => {
    expect(usernameError("nipun")).toBe("Usernames start with @");
    expect(usernameError("@nipuntejreddy")).toBeNull();
  });
  it("a room holds at most 15 players", () => {
    expect(isRoomFull(14)).toBe(false);
    expect(isRoomFull(15)).toBe(true);
  });
  it("random assignment picks exactly hunter_count hunters", () => {
    const roles = assignRoles(["a", "b", "c", "d", "e"], 2);
    expect(roles.filter((r) => r.role === "hunter")).toHaveLength(2);
  });
  it("join codes are cleaned to 6 uppercase characters", () => {
    expect(normalizeCode("ab-12 cd9")).toBe("AB12CD");
  });
});
