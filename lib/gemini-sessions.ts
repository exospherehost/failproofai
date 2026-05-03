/**
 * Gemini CLI session transcript discovery + JSONL parser.
 *
 * Empirically verified against gemini-cli v0.40.1:
 *
 * Session files live at
 *   `~/.gemini/tmp/<project-basename>/chats/session-<ISO-timestamp-with-dashes>-<8-hex-uuid-prefix>.jsonl`
 * with a sidecar `<file>.jsonl.tool-calls.json` of tool-call records.
 * The basename component is just the cwd's last path segment; the canonical
 * cwd lives at `~/.gemini/tmp/<project-basename>/.project_root`.
 *
 * JSONL record schema (observed):
 *   • Line 1 (metadata): `{sessionId, projectHash, startTime, lastUpdated, kind}`
 *   • Subsequent lines:
 *       `{id, timestamp, type: "user" | "assistant" | ..., content: [{text}]}`  (messages)
 *       `{$set: {lastUpdated: "..."}}`                                          (partial update)
 *
 * Parser is intentionally permissive — unknown record types degrade to
 * "system" entries; malformed lines are skipped without aborting; and the
 * loader fall-opens (returns null) on any I/O or parse failure.
 */
import { closeSync, openSync, readFileSync, readSync, readdirSync, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { homedir } from "node:os";
import { runtimeCache } from "./runtime-cache";
import {
  baseEntry,
  type LogEntry,
  type UserEntry,
  type AssistantEntry,
  type GenericEntry,
  type QueueOperationEntry,
  type ContentBlock,
  type LogSource,
} from "./log-entries";

// ── Paths ──

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Matches `session-<timestamp-of-arbitrary-shape>-<8-hex-uuid-prefix>.jsonl`.
 *  Empirically gemini-cli v0.40.1 emits minute-precision (`YYYY-MM-DDTHH-mm`),
 *  but the documented format includes seconds (`YYYY-MM-DDTHH-mm:ss`) and may
 *  evolve further. The first-line `sessionId` validation in findGeminiTranscript
 *  is the load-bearing safety check, so we accept any timestamp shape. */
const SESSION_FILE_RE = /^session-(.+)-([0-9a-f]{8})\.jsonl$/i;

/** Root directory for Gemini session state, honoring GEMINI_SESSIONS_DIR. */
export function getGeminiSessionStateRoot(): string {
  return process.env.GEMINI_SESSIONS_DIR
    || join(homedir(), ".gemini", "tmp");
}

/** Reject a sessionId that isn't a UUID — defends against path traversal. */
function isSafeSessionId(sessionId: string): boolean {
  return UUID_RE.test(sessionId);
}

/**
 * Read up to the first newline from `path` without loading the whole file.
 * Used by `findGeminiTranscript` to inspect the JSONL metadata header on
 * candidate matches; the typical header is well under 1KB and we cap at 4KB
 * for safety so a degenerate single-line file can't blow memory.
 *
 * Returns the first line as a UTF-8 string, or null on read failure / empty
 * file. If the first 4KB contain no newline, returns whatever was read so the
 * JSON.parse caller can still attempt — JSON.parse will fail for a truncated
 * object, which findGeminiTranscript treats as a malformed-header miss.
 */
function readFirstLineSync(path: string): string | null {
  let fd: number;
  try {
    fd = openSync(path, "r");
  } catch {
    return null;
  }
  try {
    const buf = Buffer.alloc(4096);
    const bytesRead = readSync(fd, buf, 0, buf.length, 0);
    if (bytesRead === 0) return null;
    const text = buf.subarray(0, bytesRead).toString("utf-8");
    const nl = text.indexOf("\n");
    return nl >= 0 ? text.slice(0, nl) : text;
  } catch {
    return null;
  } finally {
    try { closeSync(fd); } catch { /* best-effort */ }
  }
}

/**
 * Find the JSONL transcript for `sessionId`. Walks every per-project subdir's
 * `chats/` directory, matches the 8-hex prefix, and verifies the first record's
 * full `sessionId` field matches. Rejects path-traversal sessionIds and
 * verifies resolved paths stay under the root. Returns null on miss.
 */
export function findGeminiTranscript(sessionId: string): string | null {
  if (!isSafeSessionId(sessionId)) return null;
  const root = resolve(getGeminiSessionStateRoot());
  const wantPrefix = sessionId.slice(0, 8).toLowerCase();

  let projectDirs: string[];
  try {
    projectDirs = readdirSync(root);
  } catch {
    return null;
  }

  for (const projectDir of projectDirs) {
    const projectPath = resolve(root, projectDir);
    if (!projectPath.startsWith(`${root}${sep}`)) continue;

    const chatsDir = resolve(projectPath, "chats");
    let files: string[];
    try {
      files = readdirSync(chatsDir);
    } catch {
      continue;
    }

    for (const f of files) {
      const m = SESSION_FILE_RE.exec(f);
      if (!m || m[2].toLowerCase() !== wantPrefix) continue;
      const candidate = resolve(chatsDir, f);
      if (!candidate.startsWith(`${chatsDir}${sep}`)) continue;
      if (!existsSync(candidate)) continue;
      // Confirm the full sessionId — the 8-hex prefix isn't unique on its own.
      // Read only the first ~4KB so large transcripts don't bloat memory; the
      // metadata header sits on line 1 well within that bound. The full file
      // is re-read in getGeminiSessionLog() once we've matched.
      const firstLine = readFirstLineSync(candidate);
      if (!firstLine) continue;
      try {
        const meta = JSON.parse(firstLine) as { sessionId?: unknown };
        if (typeof meta.sessionId === "string" && meta.sessionId.toLowerCase() === sessionId.toLowerCase()) {
          return candidate;
        }
      } catch {
        // Malformed first record — try next file.
        continue;
      }
    }
  }
  return null;
}

// ── Parser ──

interface GeminiSessionRecord {
  // Metadata-line fields (line 1)
  sessionId?: string;
  projectHash?: string;
  startTime?: string;
  lastUpdated?: string;
  kind?: string;
  // Message-line fields
  id?: string;
  timestamp?: string;
  type?: string;
  content?: Array<Record<string, unknown>>;
  // Partial-update line: `{$set: {...}}`
  $set?: Record<string, unknown>;
}

interface GeminiParseResult {
  entries: LogEntry[];
  rawLines: Record<string, unknown>[];
  /** Working directory pulled from the sidecar `.project_root` if available. */
  cwd?: string;
}

function extractMessageText(content: Array<Record<string, unknown>> | undefined): string {
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    if (typeof block?.text === "string") parts.push(block.text);
  }
  return parts.join("\n\n");
}

function buildAssistantContent(content: Array<Record<string, unknown>> | undefined): ContentBlock[] {
  if (!Array.isArray(content)) return [];
  const blocks: ContentBlock[] = [];
  for (const block of content) {
    if (typeof block?.text === "string" && block.text.length > 0) {
      blocks.push({ type: "text", text: block.text });
    }
  }
  return blocks;
}

/**
 * Parse a Gemini JSONL transcript into `LogEntry[]` plus the raw lines.
 * Yields to the event loop every 200 lines so big transcripts don't block
 * the request.
 */
export async function parseGeminiLog(
  fileContent: string,
  source: LogSource = "session",
  cwdHint?: string,
): Promise<GeminiParseResult> {
  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
  const entries: LogEntry[] = [];
  const rawLines: Record<string, unknown>[] = [];
  let cwd: string | undefined = cwdHint;
  let seenStart = false;

  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && i % 200 === 0) await new Promise<void>((r) => setImmediate(r));

    const line = lines[i];
    let raw: GeminiSessionRecord;
    try {
      raw = JSON.parse(line) as GeminiSessionRecord;
    } catch {
      continue;
    }

    const rawCopy = { ...(raw as Record<string, unknown>), _source: source };
    rawLines.push(rawCopy);

    // Metadata line — derive a synthetic "Session Started" entry from startTime.
    if (typeof raw.sessionId === "string" && typeof raw.startTime === "string") {
      const date = new Date(raw.startTime);
      if (!Number.isNaN(date.getTime())) {
        const label: QueueOperationEntry["label"] = seenStart ? "Session Resumed" : "Session Started";
        seenStart = true;
        entries.push({
          type: "queue-operation",
          ...baseEntry(rawCopy, date.toISOString(), date, source),
          label,
        } satisfies QueueOperationEntry);
      }
      continue;
    }

    // Partial-update line — preserve in raw but skip rendering.
    if (raw.$set) continue;

    const timestampStr = raw.timestamp;
    if (!timestampStr) continue;
    const date = new Date(timestampStr);
    if (Number.isNaN(date.getTime())) continue;
    const timestamp = date.toISOString();

    const recType = raw.type;

    if (recType === "user") {
      const text = extractMessageText(raw.content);
      if (!text) continue;
      entries.push({
        type: "user",
        ...baseEntry(rawCopy, timestamp, date, source),
        message: { role: "user", content: text },
      } satisfies UserEntry);
      continue;
    }

    if (recType === "assistant" || recType === "model") {
      const blocks = buildAssistantContent(raw.content);
      if (blocks.length === 0) {
        entries.push({
          type: "system",
          ...baseEntry(rawCopy, timestamp, date, source),
          raw: rawCopy,
        } satisfies GenericEntry);
        continue;
      }
      entries.push({
        type: "assistant",
        ...baseEntry(rawCopy, timestamp, date, source),
        message: { role: "assistant", content: blocks },
      } satisfies AssistantEntry);
      continue;
    }

    // Unknown type — preserve raw.
    entries.push({
      type: "system",
      ...baseEntry(rawCopy, timestamp, date, source),
      raw: rawCopy,
    } satisfies GenericEntry);
  }

  if (entries.length > 500) await new Promise<void>((r) => setImmediate(r));
  entries.sort((a, b) => a.timestampMs - b.timestampMs);

  return { entries, rawLines, cwd };
}

// ── Public loader ──

export interface GeminiSessionLogData {
  entries: LogEntry[];
  rawLines: Record<string, unknown>[];
  cwd?: string;
  filePath: string;
}

/** Read `.project_root` next to the chats dir to recover the absolute cwd. */
function readSiblingProjectRoot(transcriptPath: string): string | undefined {
  // transcriptPath = .../<basename>/chats/<file>.jsonl
  const chatsDir = resolve(transcriptPath, "..");
  const projectDir = resolve(chatsDir, "..");
  const rootFile = join(projectDir, ".project_root");
  try {
    const text = readFileSync(rootFile, "utf-8").trim();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

export async function getGeminiSessionLog(sessionId: string): Promise<GeminiSessionLogData | null> {
  const filePath = findGeminiTranscript(sessionId);
  if (!filePath) return null;
  let fileContent: string;
  try {
    fileContent = await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
  const cwdHint = readSiblingProjectRoot(filePath);
  let parsed: GeminiParseResult;
  try {
    parsed = await parseGeminiLog(fileContent, "session", cwdHint);
  } catch {
    return null;
  }
  return {
    entries: parsed.entries,
    rawLines: parsed.rawLines,
    cwd: parsed.cwd,
    filePath,
  };
}

export const getCachedGeminiSessionLog = runtimeCache(
  (sessionId: string) => getGeminiSessionLog(sessionId),
  60,
  { maxSize: 50 },
);

// ── Test helpers ──

export function _statGeminiTranscript(sessionId: string): { mtimeMs: number } | null {
  const path = findGeminiTranscript(sessionId);
  if (!path) return null;
  try {
    const s = statSync(path);
    return { mtimeMs: s.mtimeMs };
  } catch {
    return null;
  }
}

export function readGeminiTranscriptSync(sessionId: string): string | null {
  const path = findGeminiTranscript(sessionId);
  if (!path) return null;
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}
