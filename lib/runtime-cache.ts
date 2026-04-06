/**
 * Simple in-memory cache with TTL, used instead of Next.js `unstable_cache`.
 *
 * Next.js Data Cache writes results to .next/cache at build time and
 * re-serves them indefinitely unless explicitly revalidated. Since our
 * data comes from local JSONL files that change outside of Next.js,
 * those stale build-time entries cause ghost data on first load.
 *
 * This in-process Map-based cache avoids that problem: entries expire
 * after `revalidateSeconds` and are never persisted to disk.
 *
 * Optional `maxSize` enables LRU eviction — when the cache is full,
 * the least-recently-used entry is evicted before inserting a new one.
 */

export interface RuntimeCacheOptions {
  maxSize?: number;
}

export function runtimeCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  revalidateSeconds: number,
  options?: RuntimeCacheOptions,
): (...args: TArgs) => Promise<TResult> {
  const cache = new Map<string, { data: TResult; expiry: number }>();
  const inflight = new Map<string, Promise<TResult>>();
  const maxSize = options?.maxSize;

  return async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify(args);
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }

    // Coalesce concurrent requests for the same uncached key
    const existing = inflight.get(key);
    if (existing) return existing;

    const promise = fn(...args).then(
      (data) => {
        inflight.delete(key);
        // Evict least-recently-used entry if at capacity
        if (maxSize && cache.size >= maxSize) {
          const oldestKey = cache.keys().next().value!;
          cache.delete(oldestKey);
        }
        cache.set(key, { data, expiry: Date.now() + revalidateSeconds * 1000 });
        return data;
      },
      (err) => {
        inflight.delete(key);
        throw err;
      },
    );
    inflight.set(key, promise);
    return promise;
  };
}
