/**
 * Tailwind class-name merger.
 *
 * `cn()` combines `clsx` (conditional class composition) with `tailwind-merge`
 * (last-wins conflict resolution for Tailwind utility classes).
 *
 * Date formatting lives in lib/format-date.ts — kept separate so server-side
 * callers don't need to load clsx/tailwind-merge just to print a timestamp.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
