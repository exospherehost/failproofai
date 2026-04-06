/**
 * Shared date filtering utilities for project and session list views.
 *
 * Both `ProjectList` and `SessionsList` need identical preset-based and
 * custom-range date filtering plus pagination.  This module centralises
 * that logic so each component can import a single `filterByDate` call
 * instead of duplicating ~80 lines of date math.
 */

// ── Types ──

/** Preset filter options available in both project and session lists. */
export type FilterPreset =
  | "all"
  | "last-hour"
  | "today"
  | "last-7-days"
  | "last-30-days"
  | "custom";

/** Custom date range boundaries (either or both may be null). */
export interface DateRange {
  from: Date | null;
  to: Date | null;
}

// ── Constants ──

/** UI labels for each filter preset button. */
export const FILTER_PRESETS: { value: FilterPreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "last-hour", label: "Last Hour" },
  { value: "today", label: "Today" },
  { value: "last-7-days", label: "Last 7 Days" },
  { value: "last-30-days", label: "Last 30 Days" },
];

/** Number of items shown per page in paginated lists. */
export const ITEMS_PER_PAGE = 25;

// ── Date helpers ──

/** Returns the start of the given day (00:00:00.000). */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the end of the given day (23:59:59.999). */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns the cutoff date for a given filter preset, or `null` for presets
 * that don't use a simple cutoff ("all" and "custom").
 */
export function getDateCutoff(preset: FilterPreset): Date | null {
  const now = new Date();
  switch (preset) {
    case "last-hour":
      return new Date(now.getTime() - 60 * 60 * 1000);
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "last-7-days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "last-30-days":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

// ── Filtering ──

/**
 * Filters an array of items by date using either a preset cutoff or a
 * custom from/to range.  Works with any object that has a `lastModified`
 * Date property (e.g. `ProjectFolder`, `SessionFile`).
 */
export function filterByDate<T extends { lastModified: Date }>(
  items: T[],
  preset: FilterPreset,
  dateRange: DateRange,
): T[] {
  if (preset === "all") return items;

  if (preset === "custom") {
    const from = dateRange.from ? startOfDay(dateRange.from) : null;
    const to = dateRange.to ? endOfDay(dateRange.to) : null;
    return items.filter((item) => {
      if (from && item.lastModified < from) return false;
      if (to && item.lastModified > to) return false;
      return true;
    });
  }

  const cutoff = getDateCutoff(preset);
  if (!cutoff) return items;
  return items.filter((item) => item.lastModified >= cutoff);
}

// ── Rehydration ──

/**
 * Rehydrates `lastModified` fields that may have been serialised to strings
 * during Next.js server → client data transfer.  Returns a new array with
 * proper `Date` instances.
 */
export function rehydrateDates<T extends { lastModified: Date }>(
  items: T[],
): T[] {
  return items.map((item) => ({
    ...item,
    lastModified:
      item.lastModified instanceof Date
        ? item.lastModified
        : new Date(item.lastModified as unknown as string),
  }));
}
