// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initLogger, getLogLevel, logInfo, logWarn, logError, logActivity } from "@/lib/logger";

describe("lib/logger", () => {
  const originalEnv = process.env.FAILPROOFAI_LOG_LEVEL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.FAILPROOFAI_LOG_LEVEL;
  });

  afterEach(() => {
    // Restore original env and reset to default
    if (originalEnv !== undefined) {
      process.env.FAILPROOFAI_LOG_LEVEL = originalEnv;
    } else {
      delete process.env.FAILPROOFAI_LOG_LEVEL;
    }
    initLogger();
  });

  describe("initLogger", () => {
    it("reads FAILPROOFAI_LOG_LEVEL and sets level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      initLogger();
      expect(getLogLevel()).toBe("info");
    });

    it("defaults to warn for missing env var", () => {
      initLogger();
      expect(getLogLevel()).toBe("warn");
    });

    it("defaults to warn for invalid values", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "debug";
      initLogger();
      expect(getLogLevel()).toBe("warn");
    });

    it("handles uppercase env var values", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "ERROR";
      initLogger();
      expect(getLogLevel()).toBe("error");
    });
  });

  describe("logInfo", () => {
    it("is suppressed at warn level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "warn";
      initLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logInfo("test message");
      expect(spy).not.toHaveBeenCalled();
    });

    it("is emitted at info level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      initLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logInfo("test message");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/\[failproofai.+\] INFO/);
      expect(spy.mock.calls[0][1]).toBe("test message");
    });

    it("passes detail when provided", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      initLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logInfo("msg", { key: "val" });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][2]).toEqual({ key: "val" });
    });
  });

  describe("logWarn", () => {
    it("is emitted at warn level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "warn";
      initLogger();
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logWarn("warning");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/\[failproofai.+\] WARN/);
    });

    it("is suppressed at error level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      initLogger();
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logWarn("warning");
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("logError", () => {
    it("is always emitted", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      initLogger();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logError("error msg");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/\[failproofai.+\] ERROR/);
    });

    it("is emitted at info level too", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      initLogger();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logError("error msg");
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("logActivity", () => {
    it("is suppressed at warn level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "warn";
      initLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logActivity("alice", "login");
      expect(spy).not.toHaveBeenCalled();
    });

    it("is emitted at info level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      initLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logActivity("alice", "login");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatch(/\[failproofai.+\] ACTIVITY/);
      expect(spy.mock.calls[0][1]).toContain("user=alice");
      expect(spy.mock.calls[0][1]).toContain("action=login");
    });

    it("includes detail when provided", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      initLogger();
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logActivity("bob", "queue-item", "type=eval project=P");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][1]).toContain("type=eval project=P");
    });
  });

  describe("getLogLevel", () => {
    it("returns current level", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      initLogger();
      expect(getLogLevel()).toBe("error");
    });
  });
});
