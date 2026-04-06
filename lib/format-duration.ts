/**
 * Formats a duration in milliseconds to a compact human-readable string.
 * Handles sub-second ("42ms"), seconds ("3.2s"), minutes ("5m 12s"),
 * and hours ("2h 15m").
 *
 * This module is intentionally free of Node.js imports so it can be
 * safely used in both server and client components.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${totalMinutes}m ${remainingSeconds}s`;
}
