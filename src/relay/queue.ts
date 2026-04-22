import {
  appendFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  statSync,
  renameSync,
  unlinkSync,
  readdirSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { isLoggedIn } from "../auth/token-store";

const QUEUE_DIR = join(homedir(), ".failproofai", "cache", "server-queue");
const PENDING_FILE = join(QUEUE_DIR, "pending.jsonl");
const PROCESSING_PREFIX = "processing-";

// Cap — if the queue file exceeds this, `appendToServerQueue` is a no-op.
// Prevents unbounded growth when the daemon is down for a long time or the
// user installed the CLI but never logged in.
const MAX_QUEUE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface RawEntry {
  timestamp: number;
  eventType: string;
  toolName?: string | null;
  policyName?: string | null;
  policyNames?: string[];
  decision: string;
  reason?: string | null;
  durationMs: number;
  sessionId?: string | null;
  transcriptPath?: string | null;
  cwd?: string | null;
  permissionMode?: string | null;
  hookEventName?: string | null;
  toolInput?: Record<string, unknown>;
}

/**
 * What actually gets persisted and sent to the server. Intentionally a
 * narrower shape than RawEntry — we drop / hash anything that could leak
 * secrets or paths:
 *   - toolInput: dropped entirely (can contain credentials, file contents, commands)
 *   - cwd: replaced with cwd_hash (SHA-256) so the server can group by project
 *   - transcriptPath: dropped (local-only filesystem path)
 *   - reason: passed through a redactor for common credential patterns
 */
export interface QueueEntry {
  client_event_id: string;
  timestamp: number;
  event_type: string;
  tool_name: string | null;
  policy_name: string | null;
  policy_names: string[];
  decision: string;
  reason: string | null;
  duration_ms: number;
  session_id: string | null;
  cwd_hash: string | null;
  permission_mode: string | null;
  hook_event_name: string | null;
}

function hashCwd(cwd: string | null | undefined): string | null {
  if (!cwd) return null;
  return createHash("sha256").update(cwd).digest("hex");
}

function redactReason(reason: string | null | undefined): string | null {
  if (!reason) return reason ?? null;
  return reason
    .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED-AWS-KEY]")
    .replace(/eyJ[A-Za-z0-9_=-]+\.[A-Za-z0-9_=-]+\.[A-Za-z0-9_=-]+/g, "[REDACTED-JWT]")
    .replace(/ghp_[A-Za-z0-9]{36,}/g, "[REDACTED-GH-TOKEN]")
    .replace(/sk-[A-Za-z0-9]{20,}/g, "[REDACTED-API-KEY]")
    .replace(/Bearer\s+[A-Za-z0-9_.=+-]+/gi, "Bearer [REDACTED]");
}

function sanitize(entry: RawEntry): QueueEntry {
  return {
    client_event_id: randomUUID(),
    timestamp: entry.timestamp,
    event_type: entry.eventType,
    tool_name: entry.toolName ?? null,
    policy_name: entry.policyName ?? null,
    policy_names: entry.policyNames ?? [],
    decision: entry.decision,
    reason: redactReason(entry.reason),
    duration_ms: entry.durationMs,
    session_id: entry.sessionId ?? null,
    cwd_hash: hashCwd(entry.cwd),
    permission_mode: entry.permissionMode ?? null,
    hook_event_name: entry.hookEventName ?? null,
  };
}

function ensureDir(): void {
  if (!existsSync(QUEUE_DIR)) {
    mkdirSync(QUEUE_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Hook-side API — append one event to the pending queue.
 *
 * Uses `appendFileSync` (O_APPEND) which is atomic for small writes, so
 * concurrent hook processes interleave lines correctly without clobbering
 * each other. Sanitizes sensitive fields before persisting.
 *
 * No-op cases (keeps hook path fast and safe):
 *   - User not logged in (no auth.json exists)
 *   - Queue file already exceeds MAX_QUEUE_BYTES (prevents unbounded growth)
 */
export function appendToServerQueue(entry: RawEntry): void {
  if (!isLoggedIn()) return;
  ensureDir();

  try {
    if (existsSync(PENDING_FILE) && statSync(PENDING_FILE).size > MAX_QUEUE_BYTES) {
      return;
    }
  } catch {
    // existsSync/statSync races are fine; proceed
  }

  const sanitized = sanitize(entry);
  appendFileSync(PENDING_FILE, JSON.stringify(sanitized) + "\n", { mode: 0o600 });

  // Tighten perms on first create in case the umask allowed wider access
  try {
    chmodSync(PENDING_FILE, 0o600);
  } catch {
    // Windows or non-critical; skip
  }
}

export function queueSizeBytes(): number {
  try {
    return statSync(PENDING_FILE).size;
  } catch {
    return 0;
  }
}

interface ClaimError extends Error {
  code?: string;
}

/**
 * Daemon-side API — atomically claim all pending events into a new
 * processing file. Returns the processing file path, or null ONLY when
 * there's nothing to claim (ENOENT). Other errors throw so we don't
 * silently strand events.
 */
export function claimPendingBatch(): string | null {
  if (!existsSync(PENDING_FILE)) return null;
  try {
    const size = statSync(PENDING_FILE).size;
    if (size === 0) return null;
  } catch {
    return null;
  }

  const seq = `${Date.now()}-${process.pid}`;
  const processingFile = join(QUEUE_DIR, `${PROCESSING_PREFIX}${seq}.jsonl`);
  try {
    renameSync(PENDING_FILE, processingFile);
    try {
      chmodSync(processingFile, 0o600);
    } catch {
      // non-critical
    }
    return processingFile;
  } catch (err) {
    const e = err as ClaimError;
    if (e?.code === "ENOENT") return null;
    // Real failure (EACCES, EIO, etc.) — surface to caller; don't lose events
    throw err;
  }
}

export function findOrphanProcessingFiles(): string[] {
  ensureDir();
  try {
    return readdirSync(QUEUE_DIR)
      .filter((n) => n.startsWith(PROCESSING_PREFIX) && n.endsWith(".jsonl"))
      .map((n) => join(QUEUE_DIR, n))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Parse a processing file into structured events, skipping (and logging
 * via stderr) any malformed JSON lines so one bad entry doesn't wedge
 * the entire file forever.
 */
export function readProcessingFile(path: string): QueueEntry[] {
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf8");
  const out: QueueEntry[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as QueueEntry);
    } catch {
      // Skip malformed line — we can't recover it
    }
  }
  return out;
}

export function deleteProcessingFile(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // best-effort; stale processing files are cleaned up on next run
  }
}
