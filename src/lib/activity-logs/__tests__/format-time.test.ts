import { describe, it, expect } from "vitest";
import {
  parseActivityTimestamp,
  formatActivityTime,
  toActivityISOString,
} from "../format-time";

describe("format-time", () => {
  it("returns null for invalid inputs", () => {
    expect(parseActivityTimestamp("")).toBeNull();
    expect(parseActivityTimestamp("not-a-date")).toBeNull();
    expect(parseActivityTimestamp(undefined)).toBeNull();
  });

  it("parses ISO strings", () => {
    const d = parseActivityTimestamp("2024-06-01T12:00:00.000Z");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2024-06-01T12:00:00.000Z");
  });

  it("never surfaces Invalid Date in formatActivityTime", () => {
    const bad = formatActivityTime("garbage");
    expect(bad.relative).toBe("—");
    expect(bad.full).toBe("—");
    expect(bad.full).not.toContain("Invalid");
    expect(bad.date).toBeNull();
  });

  it("toActivityISOString returns null for bad values", () => {
    expect(toActivityISOString("nope")).toBeNull();
  });
});
