import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export function resolvePermissionMode(
  integration: string,
  parsed: Record<string, unknown>,
  sessionId: string | undefined,
): string {
  if (integration === "claude-code") {
    return (parsed.permission_mode as string | undefined) ?? "default";
  }
  if (integration === "codex" && sessionId) {
    return resolveCodexMode(sessionId) ?? "default";
  }
  if (process.platform === "linux") {
    if (integration === "cursor")  return parseCursorMode(findAncestorCmdline("cursor")) ?? "default";
    if (integration === "copilot") return parseCopilotMode(findAncestorCmdline("copilot")) ?? "default";
    if (integration === "gemini")  return parseGeminiMode(findAncestorCmdline("gemini")) ?? "default";
  }
  return "default";
}

// ── Codex ─────────────────────────────────────────────────────────────────────

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
          const hit = readdirSync(dir, { withFileTypes: true })
            .find(f => f.isFile() && f.name.includes(sessionId) && f.name.endsWith(".jsonl"));
          if (hit) return join(dir, hit.name);
        }
      }
    }
  } catch { /* session may not have flushed yet */ }
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
          const policy = (obj.payload as Record<string, unknown>)?.approval_policy as string | undefined;
          if (policy === "never")      return "full-auto";
          if (policy === "on-request") return "default";
          if (policy) return policy;
        }
      } catch { /* skip malformed line */ }
    }
  } catch { /* fail silently */ }
  return undefined;
}

// ── /proc ancestor walk (Linux only) ─────────────────────────────────────────

export function findAncestorCmdline(binaryName: string): string[] | null {
  let pid = process.pid;
  for (let i = 0; i < 10; i++) {
    try {
      const status = readFileSync(`/proc/${pid}/status`, "utf-8");
      const match = status.match(/^PPid:\s*(\d+)/m);
      const ppid = match ? parseInt(match[1], 10) : null;
      if (!ppid || ppid <= 1) break;
      const raw = readFileSync(`/proc/${ppid}/cmdline`, "utf-8");
      const argv = raw.split("\0").filter(Boolean);
      if (argv[0]?.includes(binaryName) || argv[1]?.includes(binaryName)) return argv;
      pid = ppid;
    } catch { break; }
  }
  return null;
}

// ── Flag parsers ──────────────────────────────────────────────────────────────

function parseCursorMode(argv: string[] | null): string | undefined {
  if (!argv) return undefined;
  if (argv.includes("--yolo") || argv.includes("--force")) return "yolo";
  const modeIdx = argv.indexOf("--mode");
  if (modeIdx !== -1) return argv[modeIdx + 1]; // "plan" | "ask"
  return undefined;
}

function parseCopilotMode(argv: string[] | null): string | undefined {
  if (!argv) return undefined;
  if (argv.includes("--yolo") || argv.includes("--allow-all")) return "yolo";
  if (argv.includes("--allow-all-tools")) return "allow-all-tools";
  if (argv.includes("--autopilot"))       return "autopilot";
  if (argv.includes("--plan"))            return "plan";
  const modeIdx = argv.indexOf("--mode");
  if (modeIdx !== -1) {
    const val = argv[modeIdx + 1];
    if (val === "autopilot")   return "autopilot";
    if (val === "plan")        return "plan";
    if (val === "interactive") return "interactive";
  }
  return undefined;
}

function parseGeminiMode(argv: string[] | null): string | undefined {
  if (!argv) return undefined;
  if (argv.includes("--yolo")) return "yolo";
  return undefined;
}
