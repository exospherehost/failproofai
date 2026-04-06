import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runtimeCache } from "@/lib/runtime-cache";

describe("runtimeCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls underlying function on first invocation", async () => {
    const fn = vi.fn().mockResolvedValue("result");
    const cached = runtimeCache(fn, 10);
    await cached("arg1");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg1");
  });

  it("returns cached value within TTL (fn called once)", async () => {
    const fn = vi.fn().mockResolvedValue("result");
    const cached = runtimeCache(fn, 10);
    const first = await cached("arg1");
    vi.advanceTimersByTime(5000); // 5s, within 10s TTL
    const second = await cached("arg1");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(first).toBe("result");
    expect(second).toBe("result");
  });

  it("re-calls after TTL expires", async () => {
    const fn = vi.fn().mockResolvedValue("result1");
    const cached = runtimeCache(fn, 10);
    await cached("arg1");
    expect(fn).toHaveBeenCalledTimes(1);

    fn.mockResolvedValue("result2");
    vi.advanceTimersByTime(11000); // past 10s TTL
    const result = await cached("arg1");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toBe("result2");
  });

  it("different args create different cache entries", async () => {
    const fn = vi.fn().mockImplementation(async (x: string) => `result-${x}`);
    const cached = runtimeCache(fn, 10);
    const r1 = await cached("a");
    const r2 = await cached("b");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(r1).toBe("result-a");
    expect(r2).toBe("result-b");
  });

  it("returns the async result correctly", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const cached = runtimeCache(fn, 10);
    const result = await cached();
    expect(result).toBe(42);
  });

  it("coalesces concurrent calls for the same uncached key", async () => {
    let resolveCall!: (value: string) => void;
    const fn = vi.fn().mockImplementation(() => new Promise<string>((r) => { resolveCall = r; }));
    const cached = runtimeCache(fn, 10);

    // Fire two concurrent calls for the same key
    const p1 = cached("arg1");
    const p2 = cached("arg1");

    // Resolve the single underlying call
    resolveCall("shared-result");

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(r1).toBe("shared-result");
    expect(r2).toBe("shared-result");
  });

  describe("LRU eviction with maxSize", () => {
    it("evicts the least-recently-used entry when maxSize is reached", async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async (x: string) => {
        callCount++;
        return `result-${x}-${callCount}`;
      });
      const cached = runtimeCache(fn, 60, { maxSize: 3 });

      // Fill the cache to capacity
      await cached("a"); // cache: [a]
      await cached("b"); // cache: [a, b]
      await cached("c"); // cache: [a, b, c]
      expect(fn).toHaveBeenCalledTimes(3);

      // Access "a" again (should be cached, moves to end)
      const resultA = await cached("a"); // cache: [b, c, a]
      expect(fn).toHaveBeenCalledTimes(3); // no new call
      expect(resultA).toBe("result-a-1");

      // Insert "d" — should evict "b" (least recently used)
      await cached("d"); // cache: [c, a, d]
      expect(fn).toHaveBeenCalledTimes(4);

      // "b" should have been evicted — next call should re-compute
      await cached("b"); // cache: [a, d, b]
      expect(fn).toHaveBeenCalledTimes(5);

      // "c" should also have been evicted by now
      await cached("c"); // cache: [d, b, c] — evicts "a"
      expect(fn).toHaveBeenCalledTimes(6);

      // "a" was evicted, should re-compute
      await cached("a");
      expect(fn).toHaveBeenCalledTimes(7);
    });

    it("does not evict when cache is under maxSize", async () => {
      const fn = vi.fn().mockImplementation(async (x: string) => `result-${x}`);
      const cached = runtimeCache(fn, 60, { maxSize: 5 });

      await cached("a");
      await cached("b");
      await cached("c");
      expect(fn).toHaveBeenCalledTimes(3);

      // All should still be cached
      await cached("a");
      await cached("b");
      await cached("c");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("works with maxSize of 1", async () => {
      const fn = vi.fn().mockImplementation(async (x: string) => `result-${x}`);
      const cached = runtimeCache(fn, 60, { maxSize: 1 });

      await cached("a");
      expect(fn).toHaveBeenCalledTimes(1);

      // "a" is cached
      await cached("a");
      expect(fn).toHaveBeenCalledTimes(1);

      // "b" evicts "a"
      await cached("b");
      expect(fn).toHaveBeenCalledTimes(2);

      // "a" was evicted
      await cached("a");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("without maxSize, cache grows unbounded", async () => {
      const fn = vi.fn().mockImplementation(async (x: string) => `result-${x}`);
      const cached = runtimeCache(fn, 60);

      // Insert many entries
      for (let i = 0; i < 100; i++) {
        await cached(`key-${i}`);
      }
      expect(fn).toHaveBeenCalledTimes(100);

      // All should still be cached
      for (let i = 0; i < 100; i++) {
        await cached(`key-${i}`);
      }
      expect(fn).toHaveBeenCalledTimes(100);
    });
  });
});
