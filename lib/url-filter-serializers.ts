/**
 * Pure encode/decode functions for URL filter serialization.
 *
 * Each pair converts between in-memory filter state and URL query-param
 * strings.  Default values return `undefined` so they are omitted from
 * the URL (keeping URLs clean).
 */

import type { FilterPreset, DateRange } from "./date-filters";

// ── Active filter state types (mirrors dashboard-client.tsx) ──

export type BooleanFilterState = "all" | "true" | "false";
export type NumberFilterState = { min: number; max: number };
export type StringFilterState = Set<string>;
export type DateFilterState = { from: string | null; to: string | null };

export type ActiveFilterState =
  | BooleanFilterState
  | NumberFilterState
  | StringFilterState
  | DateFilterState;

// ── Shared: preset ──

export function presetToParam(preset: FilterPreset): string | undefined {
  return preset === "all" ? undefined : preset;
}

export function paramToPreset(value: string | null): FilterPreset {
  const valid: FilterPreset[] = [
    "all",
    "last-hour",
    "today",
    "last-7-days",
    "last-30-days",
    "custom",
  ];
  if (value && (valid as string[]).includes(value)) return value as FilterPreset;
  return "all";
}

// ── Shared: date range ──

export function dateRangeToParams(range: DateRange): {
  from?: string;
  to?: string;
} {
  const result: { from?: string; to?: string } = {};
  if (range.from) result.from = formatDate(range.from);
  if (range.to) result.to = formatDate(range.to);
  return result;
}

export function paramsToDateRange(
  from: string | null,
  to: string | null,
): DateRange {
  return {
    from: parseDate(from),
    to: parseDate(to),
  };
}

// ── Shared: keywords ──

export function keywordsToParam(keywords: string[]): string | undefined {
  if (keywords.length === 0) return undefined;
  return keywords.map((k) => encodeURIComponent(k)).join(",");
}

export function paramToKeywords(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((k) => decodeURIComponent(k.trim()))
    .filter((k) => k.length > 0);
}

// ── Shared: page ──

export function pageToParam(page: number): string | undefined {
  return page <= 1 ? undefined : String(page);
}

export function paramToPage(value: string | null): number {
  if (!value) return 1;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

// ── Helpers ──

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  if (!isValidDateStr(s)) return null;
  // Parse as local date (noon to avoid timezone edge cases)
  const [year, month, day] = s.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function isValidDateStr(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}
