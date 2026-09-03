import { describe, expect, it } from "vitest";

import {
  classifyMaximum,
  classifyMinimum,
  getAgeSeconds,
  getOverallHealth,
} from "@/lib/operations/releaseHealth";

describe("release health thresholds", () => {
  it("escalates maximum thresholds at their inclusive boundaries", () => {
    expect(classifyMaximum(119, 120, 600)).toBe("ok");
    expect(classifyMaximum(120, 120, 600)).toBe("warning");
    expect(classifyMaximum(600, 120, 600)).toBe("critical");
  });

  it("escalates minimum thresholds at their inclusive boundaries", () => {
    expect(classifyMinimum(21, 20, 10)).toBe("ok");
    expect(classifyMinimum(20, 20, 10)).toBe("warning");
    expect(classifyMinimum(10, 20, 10)).toBe("critical");
  });

  it("calculates nonnegative ages and rejects invalid timestamps", () => {
    const now = Date.parse("2026-09-03T12:00:00.000Z");
    expect(getAgeSeconds("2026-09-03T11:58:00.000Z", now)).toBe(120);
    expect(getAgeSeconds("2026-09-03T12:01:00.000Z", now)).toBe(0);
    expect(getAgeSeconds(null, now)).toBe(0);
    expect(getAgeSeconds("invalid", now)).toBe(Number.POSITIVE_INFINITY);
  });

  it("reports the most severe status", () => {
    expect(getOverallHealth(["ok", "warning", "ok"])).toBe("warning");
    expect(getOverallHealth(["warning", "critical"])).toBe("critical");
    expect(getOverallHealth([])).toBe("ok");
  });
});
