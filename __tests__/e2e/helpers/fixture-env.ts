/**
 * Per-test fixture environment: isolated cwd and HOME directories.
 *
 * Each call to createFixtureEnv() creates two temp directories:
 *   - cwd:  pass as payload.cwd → hooks-config.json loaded from here
 *   - home: pass as runHook opts.homeDir → blocks real ~/.failproofai from leaking in
 *
 * Cleanup is registered via afterEach() automatically.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach } from "vitest";

export interface FixtureEnv {
  /** Pass as payload.cwd — hooks-config.json is resolved relative to this. */
  cwd: string;
  /** Pass as runHook({ homeDir }) — isolates ~/.failproofai from the real system. */
  home: string;
  /**
   * Write a hooks-config.json for this fixture.
   *
   * @param config - The config object to write
   * @param scope  - "project" → {cwd}/.failproofai/hooks-config.json (default)
   *                 "local"   → {cwd}/.failproofai/hooks-config.local.json
   *                 "global"  → {home}/.failproofai/hooks-config.json
   */
  writeConfig(config: object, scope?: "project" | "local" | "global"): void;
  /**
   * Write a custom hook file inside the fixture cwd.
   * Returns the absolute path (suitable for use as customHooksPath in config).
   */
  writeHook(filename: string, content: string): string;
}

export function createFixtureEnv(): FixtureEnv {
  const cwd = mkdtempSync(join(tmpdir(), "failproofai-e2e-cwd-"));
  const home = mkdtempSync(join(tmpdir(), "failproofai-e2e-home-"));

  afterEach(() => {
    try { rmSync(cwd, { recursive: true, force: true }); } catch { /* ignore */ }
    try { rmSync(home, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  return {
    cwd,
    home,

    writeConfig(config: object, scope: "project" | "local" | "global" = "project") {
      let configPath: string;

      if (scope === "global") {
        const dir = join(home, ".failproofai");
        mkdirSync(dir, { recursive: true });
        configPath = join(dir, "hooks-config.json");
      } else {
        const dir = join(cwd, ".failproofai");
        mkdirSync(dir, { recursive: true });
        const filename = scope === "local" ? "hooks-config.local.json" : "hooks-config.json";
        configPath = join(dir, filename);
      }

      writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    },

    writeHook(filename: string, content: string): string {
      const hooksDir = join(cwd, ".hooks");
      mkdirSync(hooksDir, { recursive: true });
      const filePath = join(hooksDir, filename);
      writeFileSync(filePath, content, "utf8");
      return filePath;
    },
  };
}
