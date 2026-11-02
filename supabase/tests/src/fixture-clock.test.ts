import { describe, expect, it } from "vitest";
import { nextFixtureDayUtc } from "./fixture-clock.ts";

describe("database-relative fixture clocks", () => {
  it.each([
    ["2020-02-28T23:59:59.999Z", "2020-02-29T10:00:00.000Z"],
    ["2026-11-01T11:00:00.000Z", "2026-11-02T10:00:00.000Z"],
    ["2040-12-31T00:00:00.000Z", "2041-01-01T10:00:00.000Z"],
    ["2040-12-31T23:59:59.999Z", "2041-01-01T10:00:00.000Z"],
  ])("keeps lifecycle time ahead of SQL defaults at %s", (databaseTime, expected) => {
    const clock = nextFixtureDayUtc(Date.parse(databaseTime));
    expect(new Date(clock).toISOString()).toBe(expected);
    expect(clock).toBeGreaterThan(Date.parse(databaseTime));
  });
});
