/**
 * Formats a date to a readable string format (e.g., "Jan 15, 2024, 3:45 PM").
 *
 * Creates a new Intl.DateTimeFormat on each call intentionally — this runs
 * server-side where there's no shared state concern. The client-side hot-path
 * formatter in lib/log-format.ts caches its instance at module scope instead.
 *
 * Lives in its own module (rather than lib/utils.ts) so server-side callers
 * — including the hook handler's transitive imports — don't need to pull in
 * clsx/tailwind-merge just to format a date.
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
