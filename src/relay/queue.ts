import {
  appendFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  statSync,
  renameSync,
  unlinkSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const QUEUE_DIR = join(homedir(), ".failproofai", "cache", "server-queue");
const PENDING_FILE = join(QUEUE_DIR, "pending.jsonl");
const PROCESSING_PREFIX = "processing-";

export interface QueueEntry {
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

function ensureDir(): void {
  if (!existsSync(QUEUE_DIR)) mkdirSync(QUEUE_DIR, { recursive: true });
}

/**
 * Hook-side API — append one event to the pending queue.
 *
 * Uses `appendFileSync` (O_APPEND) which is atomic for small writes, so
 * concurrent hook processes will interleave lines correctly without
 * clobbering each other.
 */
export function appendToServerQueue(entry: QueueEntry): void {
  ensureDir();
  appendFileSync(PENDING_FILE, JSON.stringify(entry) + "\n");
}

export function queueSizeBytes(): number {
  try {
    return statSync(PENDING_FILE).size;
  } catch {
    return 0;
  }
}

/**
 * Daemon-side API — atomically claim all pending events into a new
 * processing file. Returns the processing file path (or null if nothing
 * to process).
 *
 * After rename, the hook's next appendFileSync will recreate pending.jsonl
 * fresh, so concurrent appends never collide with the processing batch.
 * The rename is atomic on POSIX (and on Windows via MoveFileEx).
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
    return processingFile;
  } catch {
    return null;
  }
}

/**
 * Find any orphaned processing-*.jsonl files (left over from a daemon
 * that crashed mid-flush). Called on daemon startup so events are
 * never lost even across unclean shutdowns.
 */
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

export function readProcessingFile(path: string): string[] {
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf8");
  return content.split("\n").filter((line) => line.trim().length > 0);
}

/**
 * After the daemon has successfully relayed a processing file's events
 * to the server, delete it. If this fails (permission error, etc.)
 * the events will be re-sent on next start — idempotent on the server
 * via event_id deduplication.
 */
export function deleteProcessingFile(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // best-effort; stale processing files are cleaned up on next run
  }
}
