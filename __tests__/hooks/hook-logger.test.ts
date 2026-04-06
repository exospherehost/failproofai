// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  hookLogInfo,
  hookLogWarn,
  hookLogError,
  _resetHookLogger,
} from "../../src/hooks/hook-logger";
import {
  appendFileSync,
  renameSync,
  existsSync,
  statSync,
} from "node:fs";

// Mock fs to isolate file-logging tests
vi.mock("node:fs", () => ({
  appendFileSync: vi.fn(),
  renameSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => false),
  statSync: vi.fn(() => ({ size: 0 })),
}));

describe("hooks/hook-logger", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  const originalLogLevel = process.env.FAILPROOFAI_LOG_LEVEL;
  const originalLogFile = process.env.FAILPROOFAI_HOOK_LOG_FILE;

  beforeEach(() => {
    _resetHookLogger();
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    delete process.env.FAILPROOFAI_LOG_LEVEL;
    delete process.env.FAILPROOFAI_HOOK_LOG_FILE;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalLogLevel !== undefined) {
      process.env.FAILPROOFAI_LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.FAILPROOFAI_LOG_LEVEL;
    }
    if (originalLogFile !== undefined) {
      process.env.FAILPROOFAI_HOOK_LOG_FILE = originalLogFile;
    } else {
      delete process.env.FAILPROOFAI_HOOK_LOG_FILE;
    }
    _resetHookLogger();
  });

  // ── Level filtering ──

  describe("level filtering", () => {
    it("defaults to warn — info is suppressed", () => {
      hookLogInfo("should not appear");
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("defaults to warn — warn is emitted", () => {
      hookLogWarn("warning message");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it("defaults to warn — error is emitted", () => {
      hookLogError("error message");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it("at info level, info is emitted", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      hookLogInfo("info message");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it("at error level, warn is suppressed", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      hookLogWarn("should not appear");
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("at error level, error is emitted", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      hookLogError("error message");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it("handles uppercase env var", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "INFO";
      hookLogInfo("info message");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it("treats invalid env values as warn", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "debug";
      hookLogInfo("should not appear");
      expect(stderrSpy).not.toHaveBeenCalled();
      hookLogWarn("should appear");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ── Output format ──

  describe("output format", () => {
    it("writes to stderr, not stdout", () => {
      hookLogWarn("test");
      expect(stderrSpy).toHaveBeenCalled();
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("output contains [failproofai:hook] prefix", () => {
      hookLogWarn("test");
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain("[failproofai:hook]");
    });

    it("info output contains INFO label", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      hookLogInfo("test");
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain("INFO");
    });

    it("warn output contains WARN label", () => {
      hookLogWarn("test");
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain("WARN");
    });

    it("error output contains ERROR label", () => {
      hookLogError("test");
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain("ERROR");
    });

    it("output ends with newline", () => {
      hookLogWarn("test");
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toMatch(/\n$/);
    });

    it("output contains the message", () => {
      hookLogWarn("my specific warning");
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain("my specific warning");
    });
  });

  // ── Lazy init ──

  describe("lazy initialization", () => {
    it("reads env only once — caches result", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      hookLogInfo("first call");
      expect(stderrSpy).toHaveBeenCalledTimes(1);

      // Change env after first call — should have no effect
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      hookLogInfo("second call");
      expect(stderrSpy).toHaveBeenCalledTimes(2); // Still emits because cached level is info
    });

    it("_resetHookLogger allows re-reading env var", () => {
      process.env.FAILPROOFAI_LOG_LEVEL = "info";
      hookLogInfo("before reset");
      expect(stderrSpy).toHaveBeenCalledTimes(1);

      _resetHookLogger();
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      hookLogInfo("after reset");
      expect(stderrSpy).toHaveBeenCalledTimes(1); // Not called again — error level suppresses info
    });
  });

  // ── File logging ──

  describe("file logging", () => {
    it("disabled when FAILPROOFAI_HOOK_LOG_FILE is unset", () => {
      hookLogWarn("no file");
      expect(appendFileSync).not.toHaveBeenCalled();
    });

    it("enabled with '1' — calls appendFileSync", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      process.env.FAILPROOFAI_HOOK_LOG_FILE = "1";
      hookLogWarn("file log test");
      expect(appendFileSync).toHaveBeenCalled();
      const writtenContent = vi.mocked(appendFileSync).mock.calls[0][1] as string;
      expect(writtenContent).toContain("WARN");
      expect(writtenContent).toContain("file log test");
    });

    it("enabled with 'true' — calls appendFileSync", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      process.env.FAILPROOFAI_HOOK_LOG_FILE = "true";
      hookLogWarn("file log test");
      expect(appendFileSync).toHaveBeenCalled();
    });

    it("enabled with custom path — uses that directory", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      process.env.FAILPROOFAI_HOOK_LOG_FILE = "/tmp/custom-logs";
      hookLogWarn("custom path test");
      expect(appendFileSync).toHaveBeenCalled();
      const writtenPath = vi.mocked(appendFileSync).mock.calls[0][0] as string;
      expect(writtenPath).toContain("/tmp/custom-logs");
    });

    it("respects FAILPROOFAI_LOG_LEVEL for file output", () => {
      process.env.FAILPROOFAI_HOOK_LOG_FILE = "1";
      process.env.FAILPROOFAI_LOG_LEVEL = "error";
      hookLogWarn("suppressed");
      expect(appendFileSync).not.toHaveBeenCalled();
    });

    it("file content includes ISO timestamp", () => {
      vi.mocked(existsSync).mockReturnValue(false);
      process.env.FAILPROOFAI_HOOK_LOG_FILE = "1";
      hookLogWarn("timestamp test");
      const writtenContent = vi.mocked(appendFileSync).mock.calls[0][1] as string;
      // ISO timestamp pattern: 2024-01-01T00:00:00.000Z
      expect(writtenContent).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("rotation triggers when file exceeds size threshold", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(statSync).mockReturnValue({ size: 600 * 1024 } as any); // >500KB
      process.env.FAILPROOFAI_HOOK_LOG_FILE = "1";
      hookLogWarn("rotation test");
      expect(renameSync).toHaveBeenCalled();
      expect(appendFileSync).toHaveBeenCalled();
    });

    it("does not rotate when file is under size threshold", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(statSync).mockReturnValue({ size: 100 } as any);
      process.env.FAILPROOFAI_HOOK_LOG_FILE = "1";
      hookLogWarn("no rotation");
      expect(renameSync).not.toHaveBeenCalled();
    });
  });
});
