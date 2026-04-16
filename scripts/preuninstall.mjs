#!/usr/bin/env node
/**
 * preuninstall script for the failproofai package.
 *
 * Removes failproofai hook entries from all reachable Claude Code settings files:
 *   - ~/.claude/settings.json            (user scope — always attempted)
 *   - {cwd}/.claude/settings.json        (project scope — if it exists)
 *   - {cwd}/.claude/settings.local.json  (local scope — if it exists)
 *
 * Does NOT delete ~/.failproofai/ (preserves cache, hooks-config, instance-id).
 *
 * Never exits non-zero — uninstall must not be blocked by cleanup failures.
 * No external dependencies — Node.js built-ins only.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir, platform, arch } from "node:os";
import { trackInstallEvent } from "./install-telemetry.mjs";

/**
 * Removes the failproofai copilot-sync lines from ~/.bashrc and ~/.zshrc.
 */
function removeCopilotSyncFromRcFiles() {
  const MARKER = "# failproofai copilot-sync";
  const rcFiles = [
    resolve(homedir(), ".bashrc"),
    resolve(homedir(), ".zshrc"),
  ];
  for (const rc of rcFiles) {
    if (!existsSync(rc)) continue;
    try {
      const content = readFileSync(rc, "utf8");
      if (!content.includes(MARKER)) continue;
      const updated = content.replace(/# failproofai copilot-sync\n[^\n]+\n?/g, "");
      writeFileSync(rc, updated, "utf8");
      console.log(`[failproofai] Removed copilot-sync entry from ${rc}.`);
    } catch {
      // Best-effort — don't block uninstall
    }
  }
}

// Skip when running in development context (same guard as postinstall.mjs).
if (process.env.INIT_CWD && process.env.INIT_CWD === process.cwd()) process.exit(0);

const FAILPROOFAI_HOOK_MARKER = "__failproofai_hook__";

/**
 * Remove all failproofai-marked hook entries from a single settings file.
 * Returns the number of hook entries removed.
 * Writes the file only when at least one hook was removed.
 */
function removeHooksFromFile(settingsPath) {
  if (!existsSync(settingsPath)) return 0;

  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    return 0; // Corrupt or unreadable — nothing to do
  }

  if (!settings?.hooks) return 0;

  let hooksRemoved = 0;

  for (const eventType of Object.keys(settings.hooks)) {
    const matchers = settings.hooks[eventType];
    if (!Array.isArray(matchers)) continue;

    for (let i = matchers.length - 1; i >= 0; i--) {
      const matcher = matchers[i];
      if (!matcher.hooks) continue;

      const before = matcher.hooks.length;
      matcher.hooks = matcher.hooks.filter((h) => {
        if (h[FAILPROOFAI_HOOK_MARKER] === true) return false; // marked entry
        // Fallback for legacy installs that predate the marker
        const cmd = typeof h.command === "string" ? h.command : "";
        if (cmd.includes("failproofai") && cmd.includes("--hook")) return false;
        return true;
      });
      hooksRemoved += before - matcher.hooks.length;

      // Remove now-empty matchers
      if (matcher.hooks.length === 0) {
        matchers.splice(i, 1);
      }
    }

    // Remove now-empty event type arrays
    if (matchers.length === 0) {
      delete settings.hooks[eventType];
    }
  }

  // Remove now-empty hooks object
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  if (hooksRemoved > 0) {
    try {
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
    } catch {
      // Best-effort — don't block uninstall
    }
  }

  return hooksRemoved;
}

let totalRemoved = 0;

try {
  const home = homedir();
  const projectCwd = process.cwd();

  // Build list of settings files to clean, deduped in case cwd === home
  const candidates = [
    resolve(home, ".claude", "settings.json"),              // user scope
    resolve(projectCwd, ".claude", "settings.json"),        // project scope
    resolve(projectCwd, ".claude", "settings.local.json"),  // local scope
  ];
  const seen = new Set();
  const settingsPaths = candidates.filter((p) => {
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });

  for (const settingsPath of settingsPaths) {
    const removed = removeHooksFromFile(settingsPath);
    if (removed > 0) {
      console.log(`[failproofai] Removed ${removed} hook(s) from ${settingsPath}.`);
      totalRemoved += removed;
    }
  }

  if (totalRemoved === 0) {
    console.log("[failproofai] No hook entries found to remove.");
  }
} catch {
  // Never block uninstall
}

try {
  removeCopilotSyncFromRcFiles();
} catch {
  // Never block uninstall
}

// Telemetry — best-effort, awaited so the process stays alive long enough to send
try {
  await trackInstallEvent("package_uninstalled", {
    platform: platform(),
    arch: arch(),
    hooks_removed: totalRemoved,
  });
} catch {}
