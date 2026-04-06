"use client";

/**
 * Low-level hook for reading and writing URL query parameters.
 *
 * Wraps Next.js `useSearchParams()` + `useRouter()`.
 * - `get(key)` — read a single param
 * - `getAll()` — snapshot of all params
 * - `setAll(params)` — batch-write params; `undefined` values are removed from URL
 *
 * Uses `router.replace()` (not `push`) with `scroll: false` so the browser
 * history stays clean and the page doesn't jump.  Writes are debounced at
 * 150 ms to batch rapid state changes into a single URL update.
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useRef, useEffect } from "react";

export function useUrlParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const get = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams],
  );

  const getAll = useCallback((): URLSearchParams => {
    return new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  const setAll = useCallback(
    (params: Record<string, string | undefined>) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const next = new URLSearchParams(searchParams.toString());

        for (const [key, value] of Object.entries(params)) {
          if (value === undefined || value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }

        const qs = next.toString();
        const url = qs ? `${pathname}?${qs}` : pathname;
        router.replace(url, { scroll: false });
      }, 150);
    },
    [searchParams, pathname, router],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { get, getAll, setAll };
}
