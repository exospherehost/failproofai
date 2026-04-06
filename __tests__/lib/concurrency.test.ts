import { describe, it, expect } from "vitest";
import { batchAll } from "@/lib/concurrency";

describe("batchAll", () => {
  it("returns results in input order regardless of completion order", async () => {
    const tasks = [
      () => new Promise<string>((r) => setTimeout(() => r("slow"), 30)),
      () => Promise.resolve("fast"),
      () => new Promise<string>((r) => setTimeout(() => r("medium"), 10)),
    ];

    const results = await batchAll(tasks, 3);

    expect(results).toEqual([
      { status: "fulfilled", value: "slow" },
      { status: "fulfilled", value: "fast" },
      { status: "fulfilled", value: "medium" },
    ]);
  });

  it("limits concurrency to the specified value", async () => {
    let running = 0;
    let maxRunning = 0;

    const makeTask = () => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 10));
      running--;
      return "done";
    };

    const tasks = Array.from({ length: 10 }, makeTask);
    await batchAll(tasks, 3);

    expect(maxRunning).toBeLessThanOrEqual(3);
    expect(maxRunning).toBeGreaterThan(1); // actually ran in parallel
  });

  it("returns an empty array for empty task list", async () => {
    const results = await batchAll([], 5);
    expect(results).toEqual([]);
  });

  it("captures rejections as PromiseSettledResult with status rejected", async () => {
    const error = new Error("boom");
    const tasks = [
      () => Promise.resolve("ok"),
      () => Promise.reject(error),
      () => Promise.resolve("also ok"),
    ];

    const results = await batchAll(tasks, 3);

    expect(results[0]).toEqual({ status: "fulfilled", value: "ok" });
    expect(results[1]).toEqual({ status: "rejected", reason: error });
    expect(results[2]).toEqual({ status: "fulfilled", value: "also ok" });
  });

  it("does not abort remaining tasks when one rejects", async () => {
    const order: number[] = [];
    const tasks = [
      () => Promise.reject(new Error("fail")),
      async () => { order.push(2); return "two"; },
      async () => { order.push(3); return "three"; },
    ];

    const results = await batchAll(tasks, 1);

    expect(order).toEqual([2, 3]);
    expect(results[1]).toEqual({ status: "fulfilled", value: "two" });
    expect(results[2]).toEqual({ status: "fulfilled", value: "three" });
  });

  it("handles concurrency greater than task count", async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.resolve(2)];
    const results = await batchAll(tasks, 100);

    expect(results).toEqual([
      { status: "fulfilled", value: 1 },
      { status: "fulfilled", value: 2 },
    ]);
  });
});
