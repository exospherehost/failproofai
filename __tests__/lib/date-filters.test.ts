import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startOfDay,
  endOfDay,
  getDateCutoff,
  filterByDate,
  rehydrateDates,
} from "@/lib/date-filters";

describe("startOfDay", () => {
  it("sets time to 00:00:00.000", () => {
    const date = new Date("2024-06-15T14:30:45.123");
    const result = startOfDay(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("does not mutate input date", () => {
    const date = new Date("2024-06-15T14:30:45.123");
    const original = date.getTime();
    startOfDay(date);
    expect(date.getTime()).toBe(original);
  });
});

describe("endOfDay", () => {
  it("sets time to 23:59:59.999", () => {
    const date = new Date("2024-06-15T14:30:45.123");
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("does not mutate input date", () => {
    const date = new Date("2024-06-15T14:30:45.123");
    const original = date.getTime();
    endOfDay(date);
    expect(date.getTime()).toBe(original);
  });
});

describe("getDateCutoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for "all"', () => {
    expect(getDateCutoff("all")).toBeNull();
  });

  it('returns null for "custom"', () => {
    expect(getDateCutoff("custom")).toBeNull();
  });

  it('"last-hour" returns 1 hour before now', () => {
    const cutoff = getDateCutoff("last-hour")!;
    const now = new Date();
    expect(now.getTime() - cutoff.getTime()).toBe(60 * 60 * 1000);
  });

  it('"today" returns midnight of current day', () => {
    const cutoff = getDateCutoff("today")!;
    expect(cutoff.getHours()).toBe(0);
    expect(cutoff.getMinutes()).toBe(0);
    expect(cutoff.getSeconds()).toBe(0);
  });

  it('"last-7-days" returns 7 days before now', () => {
    const cutoff = getDateCutoff("last-7-days")!;
    const now = new Date();
    expect(now.getTime() - cutoff.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('"last-30-days" returns 30 days before now', () => {
    const cutoff = getDateCutoff("last-30-days")!;
    const now = new Date();
    expect(now.getTime() - cutoff.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe("filterByDate", () => {
  const items = [
    { name: "old", lastModified: new Date("2024-01-01T12:00:00Z") },
    { name: "mid", lastModified: new Date("2024-06-10T12:00:00Z") },
    { name: "new", lastModified: new Date("2024-06-15T11:00:00Z") },
  ];

  it('"all" returns all items', () => {
    const result = filterByDate(items, "all", { from: null, to: null });
    expect(result).toHaveLength(3);
  });

  it("preset filter excludes items before cutoff", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    const result = filterByDate(items, "last-7-days", { from: null, to: null });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toContain("mid");
    expect(result.map((r) => r.name)).toContain("new");
    vi.useRealTimers();
  });

  it('"custom" with from only excludes items before from', () => {
    const result = filterByDate(items, "custom", {
      from: new Date("2024-06-01"),
      to: null,
    });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).not.toContain("old");
  });

  it('"custom" with to only excludes items after to', () => {
    const result = filterByDate(items, "custom", {
      from: null,
      to: new Date("2024-06-01"),
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("old");
  });

  it('"custom" with both from and to acts as range filter', () => {
    const result = filterByDate(items, "custom", {
      from: new Date("2024-06-01"),
      to: new Date("2024-06-12"),
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("mid");
  });

  it('"custom" with neither from nor to returns all', () => {
    const result = filterByDate(items, "custom", { from: null, to: null });
    expect(result).toHaveLength(3);
  });

  it("items on exact boundary are included", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    const boundaryItems = [
      { name: "exact", lastModified: new Date("2024-06-08T12:00:00.000Z") },
    ];
    const result = filterByDate(boundaryItems, "last-7-days", { from: null, to: null });
    expect(result).toHaveLength(1);
    vi.useRealTimers();
  });
});

describe("rehydrateDates", () => {
  it("converts string dates to Date objects", () => {
    const items = [
      { name: "test", lastModified: "2024-06-15T12:00:00Z" as unknown as Date },
    ];
    const result = rehydrateDates(items);
    expect(result[0].lastModified).toBeInstanceOf(Date);
  });

  it("leaves existing Date instances unchanged", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const items = [{ name: "test", lastModified: date }];
    const result = rehydrateDates(items);
    expect(result[0].lastModified).toBeInstanceOf(Date);
    expect(result[0].lastModified.getTime()).toBe(date.getTime());
  });
});
