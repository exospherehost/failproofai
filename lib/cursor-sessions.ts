/**
 * Cursor Agent CLI session transcript discovery + JSONL parser.
 *
 * Cursor stores per-session state under `~/.cursor/<subdir>/<sessionId>/`
 * (subdir is one of `agent-sessions/`, `conversations/`, or `sessions/` —
 * see `lib/cursor-projects.ts` for the rationale). Each session directory
 * is expected to contain a JSONL transcript. The on-disk format is not
 * fully specified by Cursor's docs — the parser below handles the common
 * `{ type, data, timestamp }` shape and gracefully preserves unknown record
 * types as generic system entries so nothing is silently dropped.
 *
 * If a future Cursor release tightens the format, extend
 * `parseCursorLog()` rather than fanning out new modules; the discovery
 * helpers here key only on filenames + sessionIds.
 *
 * Refs: https://cursor.com/docs/hooks
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { homedir } from "node:os";
import { runtimeCache } from "./runtime-cache";
import {
  baseEntry,
  formatTimestamp,
  type LogEntry,
  type UserEntry,
  type AssistantEntry,
  type GenericEntry,
  type QueueOperationEntry,
  type ContentBlock,
  type ToolUseBlock,
  type LogSource,
} from "./log-entries";
import { formatDuration } from "./format-duration";

// ── Paths ──

/** Subdirectories under `~/.cursor/` that may carry per-session transcripts. */
const SESSION_ROOT_CANDIDATES = ["agent-sessions", "conversations", "sessions"] as const;

/** Filenames that may carry the JSONL transcript inside a session dir. */
const TRANSCRIPT_FILE_CANDIDATES = ["events.jsonl", "transcript.jsonl", "messages.jsonl"] as const;

/** Root directory for Cursor session state, honoring CURSOR_HOME. */
export function getCursorHome(): string {
  return process.env.CURSOR_HOME || join(homedir(), ".cursor");
}

/** Locate the session directory for `sessionId` by probing each candidate root.
 *  Returns null on path-traversal sessionIds or if no directory is found. */
export function getCursorSessionDir(sessionId: string): string | null {
  if (!sessionId) return null;
  const home = resolve(getCursorHome());
  for (const sub of SESSION_ROOT_CANDIDATES) {
    const root = resolve(home, sub);
    const candidate = resolve(root, sessionId);
    // Containment check: equality with root means sessionId resolved to root itself.
    if (candidate === root || !candidate.startsWith(`${root}${sep}`)) continue;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Locate the JSONL transcript for a session by probing each filename candidate. */
export function findCursorTranscript(sessionId: string): string | null {
  const dir = getCursorSessionDir(sessionId);
  if (!dir) return null;
  for (const name of TRANSCRIPT_FILE_CANDIDATES) {
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// ── Parser ──
//
// The parser handles the common JSONL shape `{ type, data, timestamp }` and
// degrades gracefully for unknown record types. Field names are intentionally
// aligned with Copilot's parser (`session.start`, `user.message`,
// `assistant.message`, `tool.execution_start`, `tool.execution_complete`)
// since Cursor's hook payloads share most of the snake_case naming. If a real
// transcript format diverges materially, this module is the single place to
// adapt — the dashboard renders whatever LogEntry[] the parser produces.

interface CursorRecord {
  type?: string;
  data?: Record<string, unknown>;
  id?: string;
  timestamp?: string;
  parentId?: string | null;
}

interface CursorParseResult {
  entries: LogEntry[];
  rawLines: Record<string, unknown>[];
  /** Working directory pulled from the first session-start record, when available. */
  cwd?: string;
}

interface CursorToolResult {
  content?: string;
  detailedContent?: string;
}

/**
 * Parse a Cursor JSONL transcript into `LogEntry[]` plus the raw lines.
 * Yields to the event loop every 200 lines so big transcripts don't block
 * the request.
 */
export async function parseCursorLog(
  fileContent: string,
  source: LogSource = "session",
): Promise<CursorParseResult> {
  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
  const entries: LogEntry[] = [];
  const rawLines: Record<string, unknown>[] = [];
  const toolUseById = new Map<string, ToolUseBlock>();
  const toolUseStartMs = new Map<string, number>();
  let cwd: string | undefined;
  let seenSessionStart = false;

  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && i % 200 === 0) await new Promise<void>((r) => setImmediate(r));

    const line = lines[i];
    let raw: CursorRecord;
    try {
      raw = JSON.parse(line) as CursorRecord;
    } catch {
      continue;
    }

    const rawCopy = { ...(raw as Record<string, unknown>), _source: source };
    rawLines.push(rawCopy);

    const timestampStr = raw.timestamp;
    if (!timestampStr) continue;
    const date = new Date(timestampStr);
    if (Number.isNaN(date.getTime())) continue;
    const timestamp = date.toISOString();

    const recType = raw.type;
    const data = raw.data ?? {};

    // Cursor variants: "session.start", "sessionStart", "session_start" — accept all.
    if (recType === "session.start" || recType === "sessionStart" || recType === "session_start") {
      const ctx = (data.context ?? data) as { cwd?: unknown; workspace_roots?: unknown };
      const c = ctx.cwd;
      if (typeof c === "string" && !cwd) cwd = c;
      // Fallback to workspace_roots[0] (Cursor stdin field).
      if (!cwd && Array.isArray(ctx.workspace_roots) && typeof ctx.workspace_roots[0] === "string") {
        cwd = ctx.workspace_roots[0] as string;
      }
      const label: QueueOperationEntry["label"] = seenSessionStart ? "Session Resumed" : "Session Started";
      seenSessionStart = true;
      entries.push({
        type: "queue-operation",
        ...baseEntry(rawCopy, timestamp, date, source),
        label,
      } satisfies QueueOperationEntry);
      continue;
    }

    if (recType === "user.message" || recType === "userMessage") {
      const text = (data.content as string) ?? (data.text as string) ?? "";
      if (!text) continue;
      entries.push({
        type: "user",
        ...baseEntry(rawCopy, timestamp, date, source),
        message: { role: "user", content: text },
      } satisfies UserEntry);
      continue;
    }

    if (recType === "system.message" || recType === "systemMessage") {
      entries.push({
        type: "system",
        ...baseEntry(rawCopy, timestamp, date, source),
        raw: rawCopy,
      } satisfies GenericEntry);
      continue;
    }

    if (recType === "assistant.message" || recType === "assistantMessage") {
      const text = (data.content as string) ?? (data.text as string) ?? "";
      if (!text) {
        entries.push({
          type: "system",
          ...baseEntry(rawCopy, timestamp, date, source),
          raw: rawCopy,
        } satisfies GenericEntry);
        continue;
      }
      const blocks: ContentBlock[] = [{ type: "text", text }];
      entries.push({
        type: "assistant",
        ...baseEntry(rawCopy, timestamp, date, source),
        message: { role: "assistant", content: blocks },
      } satisfies AssistantEntry);
      continue;
    }

    if (
      recType === "tool.execution_start" ||
      recType === "tool.executionStart" ||
      recType === "preToolUse"
    ) {
      const callId = (data.toolCallId as string) ?? (data.tool_use_id as string);
      const name = (data.toolName as string) ?? (data.tool_name as string) ?? "tool";
      const args = ((data.arguments ?? data.tool_input) as Record<string, unknown>) ?? {};
      const id = callId ?? `${date.getTime()}-${name}`;
      const toolUse: ToolUseBlock = {
        type: "tool_use",
        id,
        name,
        input: args,
      };
      const entry: AssistantEntry = {
        type: "assistant",
        ...baseEntry(rawCopy, timestamp, date, source),
        message: { role: "assistant", content: [toolUse] },
      };
      entries.push(entry);
      if (callId) {
        toolUseById.set(callId, toolUse);
        toolUseStartMs.set(callId, date.getTime());
      }
      continue;
    }

    if (
      recType === "tool.execution_complete" ||
      recType === "tool.executionComplete" ||
      recType === "postToolUse"
    ) {
      const callId = (data.toolCallId as string) ?? (data.tool_use_id as string);
      const block = callId ? toolUseById.get(callId) : undefined;
      if (block) {
        const startMs = toolUseStartMs.get(callId!) ?? date.getTime();
        const result = (data.result as CursorToolResult | undefined) ?? {};
        const reportedMs = data.duration as number | undefined;
        const durationMs =
          typeof reportedMs === "number" && reportedMs >= 0
            ? reportedMs
            : Math.max(0, date.getTime() - startMs);
        const content =
          result.detailedContent ?? result.content ?? (data.tool_output as string) ?? "";
        block.result = {
          timestamp,
          timestampFormatted: formatTimestamp(date),
          content: typeof content === "string" ? content : JSON.stringify(content),
          durationMs,
          durationFormatted: formatDuration(durationMs),
        };
        continue;
      }
      // Orphan tool result — preserve as system.
      entries.push({
        type: "system",
        ...baseEntry(rawCopy, timestamp, date, source),
        raw: rawCopy,
      } satisfies GenericEntry);
      continue;
    }

    // Unknown record type — preserve raw so nothing is silently dropped.
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

export interface CursorSessionLogData {
  entries: LogEntry[];
  rawLines: Record<string, unknown>[];
  cwd?: string;
  filePath: string;
}

export async function getCursorSessionLog(sessionId: string): Promise<CursorSessionLogData | null> {
  const filePath = findCursorTranscript(sessionId);
  if (!filePath) return null;
  let fileContent: string;
  try {
    fileContent = await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
  const { entries, rawLines, cwd } = await parseCursorLog(fileContent, "session");
  return { entries, rawLines, cwd, filePath };
}

export const getCachedCursorSessionLog = runtimeCache(
  (sessionId: string) => getCursorSessionLog(sessionId),
  60,
  { maxSize: 50 },
);

// ── Test helpers ──

/** For tests: read raw stat of the transcript path, returning null on miss. */
export function _statTranscript(sessionId: string): { mtimeMs: number } | null {
  const path = findCursorTranscript(sessionId);
  if (!path) return null;
  try {
    const s = statSync(path);
    return { mtimeMs: s.mtimeMs };
  } catch {
    return null;
  }
}

/** For tests: list session IDs found in any candidate session-state subdir. */
export function _listSessionIds(): string[] {
  const home = getCursorHome();
  const ids: string[] = [];
  for (const sub of SESSION_ROOT_CANDIDATES) {
    try {
      const entries = readdirSync(join(home, sub), { withFileTypes: true });
      for (const e of entries) if (e.isDirectory()) ids.push(e.name);
    } catch {
      // missing sub — skip
    }
  }
  return ids;
}

/** Surface a sync read variant used by lower-level code paths. */
export function readCursorTranscriptSync(sessionId: string): string | null {
  const path = findCursorTranscript(sessionId);
  if (!path) return null;
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}
