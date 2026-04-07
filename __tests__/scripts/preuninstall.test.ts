// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";

const FAKE_HOME = "/fake/home";
const FAKE_CWD = "/fake/project";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => FAKE_HOME),
  platform: vi.fn(() => "linux"),
  arch: vi.fn(() => "x64"),
}));

vi.mock("../../scripts/install-telemetry.mjs", () => ({
  trackInstallEvent: vi.fn(() => Promise.resolve()),
}));

const USER_SETTINGS = resolve(FAKE_HOME, ".claude", "settings.json");
const PROJECT_SETTINGS = resolve(FAKE_CWD, ".claude", "settings.json");
const LOCAL_SETTINGS = resolve(FAKE_CWD, ".claude", "settings.local.json");

/** A settings object with one failproofai-marked hook under PreToolUse. */
function settingsWithMarkedHook(): string {
  return JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          hooks: [
            {
              type: "command",
              command: '"/usr/local/bin/failproofai" --hook PreToolUse',
              timeout: 60000,
              __failproofai_hook__: true,
            },
          ],
        },
      ],
    },
  });
}

describe("preuninstall script", () => {
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(FAKE_CWD);
    exitSpy = vi.spyOn(process, "exit").mockImplementation((_code?: string | number | null) => {
      throw new Error("process.exit called");
    });
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.INIT_CWD = "/some/other/dir";
  });

  afterEach(() => {
    delete process.env.INIT_CWD;
    vi.restoreAllMocks();
  });

  describe("dev context guard", () => {
    it("exits 0 when INIT_CWD is not set", async () => {
      delete process.env.INIT_CWD;
      await expect(import("../../scripts/preuninstall.mjs")).rejects.toThrow("process.exit called");
      expect(exitSpy).toHaveBeenCalledWith(0);
      const { writeFileSync } = await import("node:fs");
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it("exits 0 when INIT_CWD equals cwd", async () => {
      process.env.INIT_CWD = FAKE_CWD;
      await expect(import("../../scripts/preuninstall.mjs")).rejects.toThrow("process.exit called");
      expect(exitSpy).toHaveBeenCalledWith(0);
      const { writeFileSync } = await import("node:fs");
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("removeHooksFromFile", () => {
    it("removes __failproofai_hook__ marked entries from user settings", async () => {
      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockImplementation((p) => p === USER_SETTINGS);
      vi.mocked(readFileSync).mockReturnValue(settingsWithMarkedHook());

      await import("../../scripts/preuninstall.mjs");

      expect(writeFileSync).toHaveBeenCalledOnce();
      const [path, content] = vi.mocked(writeFileSync).mock.calls[0];
      expect(path).toBe(USER_SETTINGS);
      const written = JSON.parse(content as string);
      expect(written.hooks).toBeUndefined();
    });

    it("removes legacy hooks via command string detection", async () => {
      const legacySettings = JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              hooks: [
                {
                  type: "command",
                  command: "failproofai --hook PreToolUse",
                  timeout: 60000,
                  // no __failproofai_hook__ marker
                },
              ],
            },
          ],
        },
      });

      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockImplementation((p) => p === USER_SETTINGS);
      vi.mocked(readFileSync).mockReturnValue(legacySettings);

      await import("../../scripts/preuninstall.mjs");

      expect(writeFileSync).toHaveBeenCalledOnce();
      const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
      expect(written.hooks).toBeUndefined();
    });

    it("preserves non-failproofai hooks in the same matcher", async () => {
      const mixedSettings = JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              hooks: [
                {
                  type: "command",
                  command: "some-other-tool --pre",
                  timeout: 30000,
                },
                {
                  type: "command",
                  command: '"/usr/local/bin/failproofai" --hook PreToolUse',
                  timeout: 60000,
                  __failproofai_hook__: true,
                },
              ],
            },
          ],
        },
      });

      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockImplementation((p) => p === USER_SETTINGS);
      vi.mocked(readFileSync).mockReturnValue(mixedSettings);

      await import("../../scripts/preuninstall.mjs");

      expect(writeFileSync).toHaveBeenCalledOnce();
      const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
      expect(written.hooks.PreToolUse[0].hooks).toHaveLength(1);
      expect(written.hooks.PreToolUse[0].hooks[0].command).toBe("some-other-tool --pre");
    });

    it("cleans up empty matchers, event types, and hooks object after removal", async () => {
      const settings = JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              hooks: [
                {
                  type: "command",
                  command: '"/bin/failproofai" --hook PreToolUse',
                  timeout: 60000,
                  __failproofai_hook__: true,
                },
              ],
            },
          ],
          PostToolUse: [
            {
              hooks: [
                {
                  type: "command",
                  command: '"/bin/failproofai" --hook PostToolUse',
                  timeout: 60000,
                  __failproofai_hook__: true,
                },
              ],
            },
          ],
        },
        permissions: { allow: ["Bash"] },
      });

      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockImplementation((p) => p === USER_SETTINGS);
      vi.mocked(readFileSync).mockReturnValue(settings);

      await import("../../scripts/preuninstall.mjs");

      const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
      expect(written.hooks).toBeUndefined();
      expect(written.permissions).toEqual({ allow: ["Bash"] }); // other keys preserved
    });

    it("does not write the file when no failproofai hooks are present", async () => {
      const cleanSettings = JSON.stringify({
        hooks: {
          PreToolUse: [
            { hooks: [{ type: "command", command: "some-other-tool", timeout: 30000 }] },
          ],
        },
      });

      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(cleanSettings);

      await import("../../scripts/preuninstall.mjs");

      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it("skips files that do not exist", async () => {
      const { existsSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockReturnValue(false);

      await import("../../scripts/preuninstall.mjs");

      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it("handles corrupt JSON gracefully without throwing", async () => {
      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("not valid json {{{");

      await expect(import("../../scripts/preuninstall.mjs")).resolves.toBeDefined();
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it("removes hooks from all three scope files (user, project, local)", async () => {
      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(settingsWithMarkedHook());

      await import("../../scripts/preuninstall.mjs");

      const writtenPaths = vi.mocked(writeFileSync).mock.calls.map((c) => c[0] as string);
      expect(writtenPaths).toContain(USER_SETTINGS);
      expect(writtenPaths).toContain(PROJECT_SETTINGS);
      expect(writtenPaths).toContain(LOCAL_SETTINGS);
    });

    it("deduplicates settings paths when cwd equals home directory", async () => {
      cwdSpy.mockReturnValue(FAKE_HOME);

      const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(settingsWithMarkedHook());

      await import("../../scripts/preuninstall.mjs");

      const writtenPaths = vi.mocked(writeFileSync).mock.calls.map((c) => c[0] as string);
      const uniquePaths = new Set(writtenPaths);
      expect(uniquePaths.size).toBe(writtenPaths.length); // no path written twice
    });
  });

  describe("telemetry", () => {
    it("sends package_uninstalled with hooks_removed count", async () => {
      const { existsSync, readFileSync } = await import("node:fs");
      vi.mocked(existsSync).mockImplementation((p) => p === USER_SETTINGS);
      vi.mocked(readFileSync).mockReturnValue(settingsWithMarkedHook());

      await import("../../scripts/preuninstall.mjs");

      const { trackInstallEvent } = await import("../../scripts/install-telemetry.mjs");
      expect(vi.mocked(trackInstallEvent)).toHaveBeenCalledWith(
        "package_uninstalled",
        expect.objectContaining({ hooks_removed: 1 }),
      );
    });

    it("sends hooks_removed: 0 when no hooks found", async () => {
      const { existsSync } = await import("node:fs");
      vi.mocked(existsSync).mockReturnValue(false);

      await import("../../scripts/preuninstall.mjs");

      const { trackInstallEvent } = await import("../../scripts/install-telemetry.mjs");
      expect(vi.mocked(trackInstallEvent)).toHaveBeenCalledWith(
        "package_uninstalled",
        expect.objectContaining({ hooks_removed: 0 }),
      );
    });

    it("includes platform and arch in telemetry payload", async () => {
      const { existsSync } = await import("node:fs");
      vi.mocked(existsSync).mockReturnValue(false);

      await import("../../scripts/preuninstall.mjs");

      const { trackInstallEvent } = await import("../../scripts/install-telemetry.mjs");
      expect(vi.mocked(trackInstallEvent)).toHaveBeenCalledWith(
        "package_uninstalled",
        expect.objectContaining({ platform: "linux", arch: "x64" }),
      );
    });
  });
});
