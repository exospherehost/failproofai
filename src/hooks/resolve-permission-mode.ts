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
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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

function findCodexTranscriptSync(sessionId: string): string | null {
  const root = join(homedir(), ".codex", "sessions");
  try {
    for (const y of readdirSync(root, { withFileTypes: true })) {
      if (!y.isDirectory()) continue;
      for (const m of readdirSync(join(root, y.name), { withFileTypes: true })) {
        if (!m.isDirectory()) continue;
        for (const d of readdirSync(join(root, y.name, m.name), { withFileTypes: true })) {
          if (!d.isDirectory()) continue;
          const dir = join(root, y.name, m.name, d.name);
          const hit = readdirSync(dir, { withFileTypes: true }).find(
            (f) => f.isFile() && f.name.includes(sessionId) && f.name.endsWith(".jsonl"),
          );
          if (hit) return join(dir, hit.name);
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
