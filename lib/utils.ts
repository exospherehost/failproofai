/**
 * General-purpose utility helpers.
 *
 * - `cn()` — merges Tailwind CSS class names with conflict resolution.
 * - `formatDate()` — human-readable absolute date/time string (no ms).
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a readable string format (e.g., "Jan 15, 2024, 3:45 PM").
 *
 * Creates a new Intl.DateTimeFormat on each call intentionally — this runs
 * server-side where there's no shared state concern. The client-side hot-path
 * formatter in lib/log-format.ts caches its instance at module scope instead.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

