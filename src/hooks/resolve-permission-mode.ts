/**
 * Per-CLI permission mode resolver.
 *
 *   • Claude Code: reads `permission_mode` directly from the hook stdin payload.
 *     Possible values per `claude --help`: acceptEdits, auto, bypassPermissions,
 *     default, dontAsk, plan.
 *
 *   • Codex: stdin doesn't carry the permission mode. We walk
 *     ~/.codex/sessions/<YYYY>/<MM>/<DD>/<file containing sessionId>.jsonl
 *     looking for a `turn_context` record whose payload has `approval_policy`,
 *     and map: never → full-auto, on-request → default. Other values pass
 *     through. If the transcript can't be read, falls back to "default".
 *
 *     Hot-path note: handleHookEvent calls this for every Codex tool use. To
 *     avoid an O(history-size) tree scan, we (1) try today + yesterday's date
 *     directories first (transcripts for an active session live there in the
 *     common case), (2) cache the resolved transcript path to disk keyed by
 *     sessionId so subsequent hooks in the same session skip the walk entirely.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { IntegrationType } from "./types";

export function resolvePermissionMode(
  integration: IntegrationType,
  parsed: Record<string, unknown>,
  sessionId: string | undefined,
): string {
  if (integration === "claude") {
    return (parsed.permission_mode as string | undefined) ?? "default";
  }

  if (integration === "codex" && sessionId) {
    return resolveCodexMode(sessionId) ?? "default";
  }

  return "default";
}

const CACHE_PATH = join(homedir(), ".failproofai", "cache", "codex-session-paths.json");

function readCache(): Record<string, string> {
  try {
    if (!existsSync(CACHE_PATH)) return {};
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeCacheEntry(sessionId: string, path: string): void {
  try {
    mkdirSync(dirname(CACHE_PATH), { recursive: true });
    const cache = readCache();
    cache[sessionId] = path;
    writeFileSync(CACHE_PATH, JSON.stringify(cache), "utf-8");
  } catch {
    // Cache is best-effort — never block the hook on a write failure.
  }
}

function dirSearch(dir: string, sessionId: string): string | null {
  try {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      if (f.isFile() && f.name.includes(sessionId) && f.name.endsWith(".jsonl")) {
        return join(dir, f.name);
      }
    }
  } catch {
    // dir doesn't exist or unreadable
  }
  return null;
}

function findCodexTranscriptSync(sessionId: string): string | null {
  // 1) Cache hit — fastest path, O(1).
  const cache = readCache();
  const cached = cache[sessionId];
  if (cached && existsSync(cached)) return cached;

  const root = join(homedir(), ".codex", "sessions");

  // 2) Today + yesterday (covers the active-session common case).
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const datedDirs = [today, yesterday].map((d) => {
    const y = String(d.getUTCFullYear());
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return join(root, y, m, day);
  });
  for (const dir of datedDirs) {
    const hit = dirSearch(dir, sessionId);
    if (hit) {
      writeCacheEntry(sessionId, hit);
      return hit;
    }
  }

  // 3) Fallback — full tree scan (rare; older or out-of-clock-skew sessions).
  try {
    for (const y of readdirSync(root, { withFileTypes: true })) {
      if (!y.isDirectory()) continue;
      for (const m of readdirSync(join(root, y.name), { withFileTypes: true })) {
        if (!m.isDirectory()) continue;
        for (const d of readdirSync(join(root, y.name, m.name), { withFileTypes: true })) {
          if (!d.isDirectory()) continue;
          const hit = dirSearch(join(root, y.name, m.name, d.name), sessionId);
          if (hit) {
            writeCacheEntry(sessionId, hit);
            return hit;
          }
        }
      }
    }
  } catch {
    // Session may not have flushed yet; or path doesn't exist.
  }
  return null;
}

function resolveCodexMode(sessionId: string): string | undefined {
  try {
    const path = findCodexTranscriptSync(sessionId);
    if (!path) return undefined;
    for (const line of readFileSync(path, "utf-8").split("\n")) {
      if (!line.includes("turn_context")) continue;
      try {
        const obj = JSON.parse(line) as Record<string, unknown>;
        if (obj.type === "turn_context") {
          const policy = (obj.payload as Record<string, unknown> | undefined)?.approval_policy as
            | string
            | undefined;
          if (policy === "never") return "full-auto";
          if (policy === "on-request") return "default";
          if (policy) return policy;
        }
      } catch {
        // skip malformed line
      }
    }
  } catch {
    // file vanished or permission denied — fall through to undefined
  }
  return undefined;
}
