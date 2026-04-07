/**
 * Per-test fixture environment: isolated cwd and HOME directories.
 *
 * Each call to createFixtureEnv() creates two temp directories:
 *   - cwd:  pass as payload.cwd → policies-config.json loaded from here
 *   - home: pass as runHook opts.homeDir → blocks real ~/.failproofai from leaking in
 *
 * Cleanup is registered via afterEach() automatically.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach } from "vitest";

export interface FixtureEnv {
  /** Pass as payload.cwd — policies-config.json is resolved relative to this. */
  cwd: string;
  /** Pass as runHook({ homeDir }) — isolates ~/.failproofai from the real system. */
  home: string;
  /**
   * Write a policies-config.json for this fixture.
   *
   * @param config - The config object to write
   * @param scope  - "project" → {cwd}/.failproofai/policies-config.json (default)
   *                 "local"   → {cwd}/.failproofai/policies-config.local.json
   *                 "global"  → {home}/.failproofai/policies-config.json
   */
  writeConfig(config: object, scope?: "project" | "local" | "global"): void;
  /**
   * Write a custom hook file inside the fixture cwd.
   * Returns the absolute path (suitable for use as customPoliciesPath in config).
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
        configPath = join(dir, "policies-config.json");
      } else {
        const dir = join(cwd, ".failproofai");
        mkdirSync(dir, { recursive: true });
        const filename = scope === "local" ? "policies-config.local.json" : "policies-config.json";
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
