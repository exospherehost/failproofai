import { describe, it, expect } from "vitest";
import {
  presetToParam,
  paramToPreset,
  dateRangeToParams,
  paramsToDateRange,
  keywordsToParam,
  paramToKeywords,
  pageToParam,
  paramToPage,
} from "../../lib/url-filter-serializers";

// ── preset ──

describe("presetToParam / paramToPreset", () => {
  it("round-trips non-default presets", () => {
    for (const p of ["last-hour", "today", "last-7-days", "last-30-days", "custom"] as const) {
      expect(paramToPreset(presetToParam(p) ?? null)).toBe(p);
    }
  });

  it("returns undefined for default preset", () => {
    expect(presetToParam("all")).toBeUndefined();
  });

  it("falls back to 'all' for invalid input", () => {
    expect(paramToPreset(null)).toBe("all");
    expect(paramToPreset("invalid")).toBe("all");
    expect(paramToPreset("")).toBe("all");
  });
});

// ── date range ──

describe("dateRangeToParams / paramsToDateRange", () => {
  it("round-trips with both dates", () => {
    const range = { from: new Date(2024, 0, 15, 12), to: new Date(2024, 0, 20, 12) };
    const params = dateRangeToParams(range);
    expect(params).toEqual({ from: "2024-01-15", to: "2024-01-20" });
    const restored = paramsToDateRange(params.from ?? null, params.to ?? null);
    expect(restored.from?.getFullYear()).toBe(2024);
    expect(restored.from?.getMonth()).toBe(0);
    expect(restored.from?.getDate()).toBe(15);
    expect(restored.to?.getDate()).toBe(20);
  });

  it("omits null dates", () => {
    expect(dateRangeToParams({ from: null, to: null })).toEqual({});
  });

  it("handles only from", () => {
    const params = dateRangeToParams({ from: new Date(2024, 5, 1), to: null });
    expect(params).toEqual({ from: "2024-06-01" });
    const restored = paramsToDateRange(params.from ?? null, null);
    expect(restored.from).not.toBeNull();
    expect(restored.to).toBeNull();
  });

  it("returns null for invalid date strings", () => {
    expect(paramsToDateRange("not-a-date", null).from).toBeNull();
    expect(paramsToDateRange("2024-13-01", null).from).toBeNull();
  });
});

// ── keywords ──

describe("keywordsToParam / paramToKeywords", () => {
  it("round-trips keyword arrays", () => {
    const kw = ["api", "auth", "login"];
    expect(paramToKeywords(keywordsToParam(kw) ?? null)).toEqual(kw);
  });

  it("returns undefined for empty array", () => {
    expect(keywordsToParam([])).toBeUndefined();
  });

  it("returns empty array for null", () => {
    expect(paramToKeywords(null)).toEqual([]);
  });

  it("handles keywords with special characters", () => {
    const kw = ["hello world", "foo,bar"];
    const param = keywordsToParam(kw)!;
    expect(paramToKeywords(param)).toEqual(kw);
  });

  it("filters empty strings after split", () => {
    expect(paramToKeywords("a,,b")).toEqual(["a", "b"]);
  });
});

// ── page ──

describe("pageToParam / paramToPage", () => {
  it("returns undefined for page 1", () => {
    expect(pageToParam(1)).toBeUndefined();
  });

  it("round-trips non-default pages", () => {
    expect(paramToPage(pageToParam(5) ?? null)).toBe(5);
  });

  it("falls back to 1 for invalid input", () => {
    expect(paramToPage(null)).toBe(1);
    expect(paramToPage("abc")).toBe(1);
    expect(paramToPage("-1")).toBe(1);
    expect(paramToPage("0")).toBe(1);
  });
});

