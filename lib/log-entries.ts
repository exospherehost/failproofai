import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { getClaudeProjectsPath, getCopilotSessionStatePath, getOpencodeLogPath, decodeFolderName } from "./paths";
import { resolveProjectPath, resolveCopilotSessionDir, UUID_RE } from "./projects";
import { resolveSubagentPath } from "./resolve-subagent-path";
import { runtimeCache } from "./runtime-cache";
import { batchAll } from "./concurrency";
import { formatDate } from "./utils";
import { formatDuration } from "./format-duration";

// ── Source Tagging ──

export type LogSource = "session" | `agent-${string}`;

// ── Content Block Types (for assistant messages) ──

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolResultImage {
  base64: string;
  mediaType: string;
}

export interface ToolResultInfo {
  timestamp: string;
  timestampFormatted: string;
  content?: string;
  images?: ToolResultImage[];
  durationMs: number;
  durationFormatted: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: ToolResultInfo;
  subagentType?: string;
  subagentDescription?: string;
  subagentId?: string;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
  signature?: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

// ── Log Entry Types ──

export interface UserEntry {
  type: "user";
  _source: LogSource;
  uuid: string;
  parentUuid: string | null;
  timestamp: string;
  timestampMs: number;
  timestampFormatted: string;
  message: {
    role: "user";
    content: string;
  };
}

export interface AssistantEntry {
  type: "assistant";
  _source: LogSource;
  uuid: string;
  parentUuid: string | null;
  timestamp: string;
  timestampMs: number;
  timestampFormatted: string;
  message: {
    role: "assistant";
    content: ContentBlock[];
    model?: string;
  };
}

export interface GenericEntry {
  type: "file-history-snapshot" | "progress" | "system";
  _source: LogSource;
  uuid: string;
  parentUuid: string | null;
  timestamp: string;
  timestampMs: number;
  timestampFormatted: string;
  raw: Record<string, unknown>;
}

export interface QueueOperationEntry {
  type: "queue-operation";
  _source: LogSource;
  uuid: string;
  parentUuid: string | null;
  timestamp: string;
  timestampMs: number;
  timestampFormatted: string;
  label: "Session Started" | "Session Resumed";
}

export type LogEntry =
  | UserEntry
  | AssistantEntry
  | GenericEntry
  | QueueOperationEntry;

export type LogEntryType = LogEntry["type"];

// ── Helpers ──

function formatTimestamp(date: Date): string {
  const base = formatDate(date);
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${base}.${ms}`;
}

/** Shared base fields present on every log entry. */
function baseEntry(raw: Record<string, unknown>, timestamp: string, date: Date, source: LogSource) {
  return {
    _source: source,
    uuid: (raw.uuid as string) || "",
    parentUuid: (raw.parentUuid as string | null) ?? null,
    timestamp,
    timestampMs: date.getTime(),
    timestampFormatted: formatTimestamp(date),
  };
}

function extractToolResultContent(
  block: Record<string, unknown>
): { text?: string; images?: ToolResultImage[] } {
  const resultContent = block.content;
  if (typeof resultContent === "string") return { text: resultContent };
  if (Array.isArray(resultContent)) {
    const arr = resultContent as Array<Record<string, unknown>>;
    const textParts = arr
      .filter((r) => r.type === "text")
      .map((r) => r.text as string);
    const images = arr
      .filter((r) => r.type === "image")
      .map((r) => {
        const source = r.source as Record<string, unknown>;
        return {
          base64: source.data as string,
          mediaType: source.media_type as string,
        };
      })
      .filter((img) => img.base64 && img.mediaType);
    return {
      text: textParts.length > 0 ? textParts.join("\n") : undefined,
      images: images.length > 0 ? images : undefined,
    };
  }
  return { text: stringifyStructured(resultContent) };
}

/** Maps a FailproofAI HookActivityEntry to a LogEntry shape for dashboard display. */
function mapActivityEntryToLogEntry(e: any): LogEntry {
  const date = new Date(e.timestamp);
  const timestamp = date.toISOString();
  // We use "session" source for virtual integrations so they appear in the main thread
  const source: LogSource = "session";

  const baseDetails = {
    _source: source,
    uuid: (e.sessionId || "") + (e.timestamp || ""),
    parentUuid: null,
    timestamp,
    timestampMs: e.timestamp,
    timestampFormatted: formatDate(date),
  };

  const lowEvent = (e.eventType || "").toLowerCase();

  // 1. User Prompts (Claude, Cursor, Gemini, Copilot, Codex, OpenCode, Pi)
  const isUserEvent =
    lowEvent.includes("prompt") ||
    lowEvent.includes("submit") ||
    lowEvent.includes("message") ||
    lowEvent.includes("chat") ||
    lowEvent.includes("input");

  if (isUserEvent) {
    const ti = e.toolInput as Record<string, unknown> | string | undefined;
    const prompt = (
      typeof ti === "string" ? ti
        : (ti?.user_prompt ?? ti?.prompt ?? ti?.input ?? ti?.message ?? ti?.text ?? e.reason ?? "User prompt")
    );
    return {
      type: "user",
      ...baseDetails,
      message: { role: "user", content: stringifyStructured(prompt) ?? "User prompt" },
    } as UserEntry;
  }

  // 2. Tool Use (Assistant)
  const isToolEvent =
    lowEvent.includes("tool") ||
    lowEvent.includes("shell") ||
    lowEvent.includes("mcp") ||
    lowEvent.includes("readfile") ||
    lowEvent.includes("execute") ||
    lowEvent.includes("execution") ||
    lowEvent.includes("call");

  if (isToolEvent) {
    const isDeny = e.decision === "deny";
    const isInstruct = e.decision === "instruct";

    let resultContent = stringifyStructured(e.toolOutput);
    if (isDeny) {
      resultContent = `MANDATORY ACTION REQUIRED from FailproofAI (policy: ${e.policyName}): ${e.reason}`;
    } else if (isInstruct) {
      resultContent = `[FailproofAI Instruction] ${e.reason}`;
    }

    const rawToolInput = e.toolInput ?? {};
    const toolInput = (typeof rawToolInput === "object" && rawToolInput !== null)
      ? rawToolInput as Record<string, unknown>
      : { value: rawToolInput };

    return {
      type: "assistant",
      ...baseDetails,
      message: {
        role: "assistant",
        content: [{
          type: "tool_use",
          id: `${e.sessionId || ""}-tool-${e.timestamp}`,
          name: e.toolName || "unknown_tool",
          input: toolInput,
          result: resultContent ? {
            timestamp,
            timestampFormatted: formatDate(date),
            content: resultContent,
            durationMs: e.durationMs || 0,
            durationFormatted: formatDuration(e.durationMs || 0),
          } : undefined,
        }],
      },
    } as AssistantEntry;
  }

  // 3. Lifecycle Events (SessionStart, Stop, etc.)
  const isLifecycleEvent = 
    lowEvent.includes("sessionstart") || 
    lowEvent.includes("sessionend") || 
    lowEvent.includes("stop");

  if (isLifecycleEvent) {
    let content = "";
    if (lowEvent.includes("sessionstart")) {
      content = `Session started via ${e.integration || 'agent'}`;
    } else if (lowEvent.includes("sessionend")) {
      content = `Session ended`;
    } else if (lowEvent.includes("stop")) {
      const policyList = Array.isArray(e.policyNames) && e.policyNames.length > 0
        ? `\n\n**Security Policies Verified:**\n${e.policyNames.map((p: string) => `* ${p}`).join("\n")}`
        : "";
      const auditResult = e.reason ? `\n\n**Audit Result:** ${e.reason}` : "";
      content = `**Security Audit Completed**${auditResult}${policyList}`;
    }

    return {
      type: "assistant",
      ...baseDetails,
      message: {
        role: "assistant",
        content: [{ type: "text", text: content }],
      }
    } as AssistantEntry;
  }

  // 4. Conversational Response (afterAgentResponse)
  if (lowEvent.includes("response")) {
    return {
      type: "assistant",
      ...baseDetails,
      message: {
        role: "assistant",
        content: [{
          type: "text",
          text: stringifyStructured(e.toolOutput) ?? e.reason ?? "Assistant response",
        }]
      }
    } as AssistantEntry;
  }

  // 4. Session Lifecycle
  if (lowEvent.includes("start")) {
    return { type: "queue-operation", ...baseDetails, label: "Session Started" } as QueueOperationEntry;
  }

  // Fallback to System/Generic Entry
  return {
    type: "system",
    ...baseDetails,
    raw: { ...e },
  } as GenericEntry;
}

// ── Parsing ──

/**
 * Synchronous parseRawLines for callers that don't pass a source tag.
 * Keeps its own minimal loop (no subagent detection needed).
 */
export function parseRawLines(fileContent: string, source?: LogSource): Record<string, unknown>[] {
  return fileContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        if (source !== undefined) parsed._source = source;
        return [parsed];
      }
      catch { return []; }
    });
}

export interface SessionLogData {
  entries: LogEntry[];
  rawLines: Record<string, unknown>[];
  subagentIds: string[];
  sourceMode?: "native" | "fallback";
  sourceDetail?: string;
}

interface ParseFileResult {
  entries: LogEntry[];
  rawLines: Record<string, unknown>[];
  subagentIds: string[];
}

function stringifyStructured(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeTimestamp(value: unknown): Date | null {
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const asNum = Number(value);
    if (!Number.isNaN(asNum) && value.trim() !== "") {
      const dNum = new Date(asNum);
      if (!Number.isNaN(dNum.getTime())) return dNum;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Single-pass async parser that produces entries, rawLines, and subagentIds
 * from one iteration over the JSONL content. Yields to the event loop every
 * 200 lines to prevent blocking during large file processing.
 */
async function parseFileContent(fileContent: string, source: LogSource): Promise<ParseFileResult> {
  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

  const toolResultMap = new Map<
    string,
    { timestamp: string; timestampMs: number; content?: string; images?: ToolResultImage[]; agentId?: string }
  >();
  const entries: LogEntry[] = [];
  const rawLines: Record<string, unknown>[] = [];
  const subagentIdSet = new Set<string>();
  let seenQueue = false;

  for (let i = 0; i < lines.length; i++) {
    // Yield to the event loop every 200 lines to prevent starvation
    if (i > 0 && i % 200 === 0) await new Promise<void>(r => setImmediate(r));

    const line = lines[i];
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }

    // Collect raw line with source tag (mirrors parseRawLines with source)
    const rawCopy = { ...raw, _source: source };
    rawLines.push(rawCopy);

    const eventType = raw.eventType as string | undefined; // Handle FailproofAI HookActivityEntry format
    if (eventType) {
      entries.push(mapActivityEntryToLogEntry(raw));
      continue;
    }

    const type = raw.type as string | undefined;
    const timestampRaw = raw.timestamp;
    if (!timestampRaw) continue;

    const timestamp = typeof timestampRaw === "number" ? new Date(timestampRaw).toISOString() : String(timestampRaw);
    const date = new Date(timestamp);
    const timestampMs = date.getTime();

    if (type === "user") {
      const message = raw.message as Record<string, unknown> | undefined;
      if (Array.isArray(message?.content)) {
        const blocks = message.content as Array<Record<string, unknown>>;
        const hasToolResult = blocks.some((b) => b.type === "tool_result");
        if (hasToolResult) {
          const toolUseResult = raw.toolUseResult as Record<string, unknown> | undefined;
          const agentId = (typeof toolUseResult?.agentId === "string") ? toolUseResult.agentId : undefined;

          // Detect subagent IDs (mirrors extractSubagentIds)
          if (agentId && /^[a-f0-9]+$/.test(agentId)) {
            subagentIdSet.add(agentId);
          }

          for (const block of blocks) {
            if (block.type !== "tool_result") continue;
            const toolUseId = block.tool_use_id as string | undefined;
            if (!toolUseId) continue;
            const { text, images } = extractToolResultContent(block);
            toolResultMap.set(toolUseId, {
              timestamp,
              timestampMs,
              content: text,
              images,
              agentId,
            });
          }
          continue;
        }
      }

      // Regular user message
      const content =
        typeof message?.content === "string" ? message.content : "";
      entries.push({ type: "user", ...baseEntry(raw, timestamp, date, source), message: { role: "user", content } });
      continue;
    }

    if (type === "assistant") {
      const message = raw.message as Record<string, unknown> | undefined;
      let content: ContentBlock[] = [];

      if (Array.isArray(message?.content)) {
        content = (message.content as Array<Record<string, unknown>>)
          .filter((block) =>
            ["text", "tool_use", "thinking"].includes(block.type as string)
          )
          .map((block) => {
            if (block.type === "text") {
              return { type: "text" as const, text: block.text as string };
            }
            if (block.type === "tool_use") {
              const input = block.input as Record<string, unknown> | undefined;
              return {
                type: "tool_use" as const,
                id: block.id as string,
                name: block.name as string,
                input: (block.input as Record<string, unknown>) ?? {},
                ...(block.name === "Task" && input ? {
                  subagentType: input.subagent_type as string | undefined,
                  subagentDescription: input.description as string | undefined,
                } : {}),
              };
            }
            return {
              type: "thinking" as const,
              thinking: block.thinking as string,
              signature: block.signature as string | undefined,
            };
          });
      }

      if (content.length === 0) continue;

      entries.push({
        type: "assistant",
        ...baseEntry(raw, timestamp, date, source),
        message: { role: "assistant", content, model: message?.model as string | undefined },
      });
      continue;
    }

    if (type === "file-history-snapshot" || type === "progress" || type === "system") {
      entries.push({ type, ...baseEntry(raw, timestamp, date, source), raw: { ...raw } });
      continue;
    }

    if (type === "queue-operation") {
      const label = seenQueue ? "Session Resumed" : "Session Started";
      seenQueue = true;
      entries.push({ type: "queue-operation", ...baseEntry(raw, timestamp, date, source), label });
      continue;
    }
  }

  // Enrichment pass: attach tool results to their corresponding tool_use blocks
  // Yield every 200 assistant entries to prevent event-loop starvation
  let enrichCount = 0;
  for (const entry of entries) {
    if (entry.type !== "assistant") continue;
    enrichCount++;
    if (enrichCount % 200 === 0) await new Promise<void>(r => setImmediate(r));
    for (const block of entry.message.content) {
      if (block.type !== "tool_use") continue;
      const resultInfo = toolResultMap.get(block.id);
      if (!resultInfo) continue;

      const returnDate = new Date(resultInfo.timestamp);
      const durationMs = Math.max(0, resultInfo.timestampMs - entry.timestampMs);
      block.result = {
        timestamp: resultInfo.timestamp,
        timestampFormatted: formatTimestamp(returnDate),
        content: resultInfo.content,
        images: resultInfo.images,
        durationMs,
        durationFormatted: formatDuration(durationMs),
      };
      if (resultInfo.agentId) {
        block.subagentId = resultInfo.agentId;
      }
    }
  }

  // Yield before sort for large arrays
  if (entries.length > 500) await new Promise<void>(r => setImmediate(r));

  // Sort by timestamp ascending
  entries.sort((a, b) => a.timestampMs - b.timestampMs);

  return { entries, rawLines, subagentIds: Array.from(subagentIdSet) };
}

function mapNativeJsonToEntries(
  json: unknown,
  source: LogSource = "session",
): LogEntry[] {
  const arr = Array.isArray(json) ? json : [json];
  const entries: LogEntry[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const timestampRaw = rec.timestamp ?? rec.created_at ?? rec.time;
    const date = normalizeTimestamp(timestampRaw);
    if (!date) continue;
    const timestamp = date.toISOString();
    const base = {
      _source: source,
      uuid: (rec.uuid as string) || (rec.id as string) || `${date.getTime()}`,
      parentUuid: (rec.parentUuid as string | null) ?? null,
      timestamp,
      timestampMs: date.getTime(),
      timestampFormatted: formatTimestamp(date),
    };
    const role = String((rec.role as string | undefined) ?? (rec.type as string | undefined) ?? "").toLowerCase();
    const text = stringifyStructured(rec.content ?? rec.text ?? rec.message ?? rec.prompt ?? rec.response);
    if (!text) continue;
    if (role === "user") {
      entries.push({ type: "user", ...base, message: { role: "user", content: text ?? "User prompt" } });
      continue;
    }
    if (role && role !== "assistant" && role !== "model" && role !== "ai") {
      continue;
    }
    entries.push({
      type: "assistant",
      ...base,
      message: { role: "assistant", content: [{ type: "text", text }] },
    });
  }
  entries.sort((a, b) => a.timestampMs - b.timestampMs);
  return entries;
}

async function parseNativeTranscript(
  transcriptPath: string,
  source: LogSource = "session",
): Promise<SessionLogData | null> {
  try {
    const content = await readFile(transcriptPath, "utf-8");
    const trimmed = content.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const entries = mapNativeJsonToEntries(parsed, source);
        if (entries.length > 0) {
          return {
            entries,
            rawLines: [],
            subagentIds: [],
            sourceMode: "native",
            sourceDetail: transcriptPath,
          };
        }
      } catch {
        // Not a pure JSON document; continue with JSONL parser.
      }
    }
    const { entries, rawLines, subagentIds } = await parseFileContent(content, source);
    if (entries.length === 0) return null;
    return {
      entries,
      rawLines,
      subagentIds,
      sourceMode: "native",
      sourceDetail: transcriptPath,
    };
  } catch {
    return null;
  }
}

function encodeCursorWorkspace(cwd: string): string {
  return cwd.replace(/^\/+/, "").replace(/[\\/]/g, "-");
}

async function findCodexTranscriptPath(sessionId: string): Promise<string | null> {
  const root = join(homedir(), ".codex", "sessions");
  try {
    const years = await readdir(root, { withFileTypes: true });
    for (const y of years) {
      if (!y.isDirectory()) continue;
      const yPath = join(root, y.name);
      const months = await readdir(yPath, { withFileTypes: true });
      for (const m of months) {
        if (!m.isDirectory()) continue;
        const mPath = join(yPath, m.name);
        const days = await readdir(mPath, { withFileTypes: true });
        for (const d of days) {
          if (!d.isDirectory()) continue;
          const dPath = join(mPath, d.name);
          const files = await readdir(dPath, { withFileTypes: true });
          const hit = files.find((f) => f.isFile() && f.name.includes(sessionId) && f.name.endsWith(".jsonl"));
          if (hit) return join(dPath, hit.name);
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function tryKnownNativeTranscriptPaths(projectName: string, sessionId: string): Promise<SessionLogData | null> {
  if (UUID_RE.test(projectName) || projectName.startsWith("ses_") || sessionId.startsWith("ses_")) {
    return null;
  }

  const cwd = decodeFolderName(projectName);
  const cursorPath = join(
    homedir(),
    ".cursor",
    "projects",
    encodeCursorWorkspace(cwd),
    "agent-transcripts",
    sessionId,
    `${sessionId}.jsonl`,
  );
  const cursorNative = await parseNativeTranscript(cursorPath);
  if (cursorNative) return cursorNative;

  const codexPath = await findCodexTranscriptPath(sessionId);
  if (codexPath) {
    const codexNative = await parseNativeTranscript(codexPath);
    if (codexNative) return codexNative;
  }

  return null;
}

// ── Public wrappers ──

/**
 * Parses JSONL log content into structured log entries.
 * Returns entries sorted by timestamp ascending (earliest first).
 * Tool use blocks are enriched with their corresponding results.
 */
export async function parseLogContent(fileContent: string, source: LogSource = "session"): Promise<LogEntry[]> {
  const result = await parseFileContent(fileContent, source);
  return result.entries;
}

/**
 * Extracts subagent type and description from parsed entries for a given agentId.
 * Scans assistant entries for Task tool_use blocks matching the agentId.
 */
export function extractSubagentMeta(
  entries: LogEntry[],
  agentId: string,
): { type?: string; description?: string } | undefined {
  for (const entry of entries) {
    if (entry.type !== "assistant") continue;
    for (const block of entry.message.content) {
      if (block.type === "tool_use" && block.name === "Task" && block.subagentId === agentId) {
        return { type: block.subagentType, description: block.subagentDescription };
      }
    }
  }
  return undefined;
}

/**
 * Reads and parses a session JSONL log file.
 * Eagerly loads all subagent JSONL files and merges them into a single
 * entries/rawLines array with `_source` markers.
 */
const SUBAGENT_CONCURRENCY = 4;

export async function parseSessionLog(
  projectName: string,
  sessionId: string,
): Promise<SessionLogData> {
  // For Copilot UUID sessions, use activity store (events.jsonl is hook activity format, not native transcript)
  if (UUID_RE.test(projectName)) {
    const { getAllHookActivityEntries } = await import("../src/hooks/hook-activity-store");
    const allActivity = getAllHookActivityEntries();
    const matching = allActivity.filter((entry) => entry.sessionId === projectName && entry.integration === "copilot");
    if (matching.length > 0) {
      const entries = matching.map(mapActivityEntryToLogEntry);
      entries.sort((a, b) => a.timestampMs - b.timestampMs);
      return { entries, rawLines: [], subagentIds: [], sourceMode: "fallback", sourceDetail: "copilot-activity-store" };
    }
  }

  // For virtual integrations, prefer activity-store native transcriptPath/fallback
  // over mirrored .claude/projects JSONL files, which may be partial.
  if (projectName.startsWith("ses_") || sessionId.startsWith("ses_")) {
    const { getAllHookActivityEntries } = await import("../src/hooks/hook-activity-store");
    const sid = sessionId.startsWith("ses_") ? sessionId : projectName;
    const allActivity = getAllHookActivityEntries();
    const matching = allActivity
      .filter((e) => (e.sessionId === sid || `ses_${e.sessionId}` === sid || e.sessionId === `ses_${sid}`) && (e.integration === "opencode" || !e.integration));
    if (matching.length > 0) {
      const nativePath = matching
        .map((e) => e.transcriptPath)
        .find((p): p is string => typeof p === "string" && p.length > 0);
      if (nativePath) {
        const native = await parseNativeTranscript(nativePath);
        if (native) return native;
      }
      // Try mirrored JSONL (has proper pre/post tool pairing via writeVirtualLogEntry sidecar)
      let mirroredEntries: LogEntry[] = [];
      let usedMirrored = false;
      const mirroredPath = join(resolveProjectPath(sid), `${sessionId}.jsonl`);
      try {
        const mirroredContent = await readFile(mirroredPath, "utf-8");
        const parsed = await parseFileContent(mirroredContent, "session");
        mirroredEntries = parsed.entries;
        usedMirrored = true;
      } catch {
        // mirrored file absent — will use activity store
      }

      // Always use activity store as source of truth for complete coverage, but prefer tool pairing from mirrored file
      const activityEntries = matching.map(mapActivityEntryToLogEntry);

      // If mirrored file exists, use it for proper tool pairing, then merge activity entries
      let allEntries: LogEntry[];
      if (usedMirrored && mirroredEntries.length > 0) {
        // Mirrored entries contain allowed tool events (proper tool result pairing from pre/post hooks).
        // Activity store has ALL events (allow, deny, instruct, lifecycle).
        // Deduplicate: skip activity entries that are already in mirrored (same tool+timestamp).
        const mirroredToolKeys = new Set(
          mirroredEntries
            .filter((e): e is AssistantEntry => e.type === "assistant")
            .map(e => {
              const content = (e as AssistantEntry).message.content[0];
              return content?.type === "tool_use" ? `${content.name}:${e.timestampMs}` : null;
            })
            .filter((key): key is string => key !== null)
        );

        const nonDuplicateActivityEntries = activityEntries.filter(e => {
          if (e.type !== "assistant") return true; // always include non-assistant entries
          const content = e.message.content[0];
          if (content?.type === "tool_use") {
            // Skip if this tool event is already in mirrored (successful execution)
            const key = `${content.name}:${e.timestampMs}`;
            return !mirroredToolKeys.has(key);
          }
          return true; // include non-tool assistant entries (lifecycle, text, etc.)
        });

        allEntries = [...mirroredEntries, ...nonDuplicateActivityEntries];
      } else {
        // No mirrored file or empty — use activity store directly
        allEntries = activityEntries;
      }

      allEntries.sort((a, b) => a.timestampMs - b.timestampMs);
      return {
        entries: allEntries,
        rawLines: [],
        subagentIds: [],
        sourceMode: usedMirrored ? "native" : "fallback",
        sourceDetail: usedMirrored ? mirroredPath : "opencode-activity-store",
      };
    }
  } else if (!UUID_RE.test(projectName)) {
    const knownNative = await tryKnownNativeTranscriptPaths(projectName, sessionId);
    if (knownNative) return knownNative;

    const { getAllHookActivityEntries } = await import("../src/hooks/hook-activity-store");
    const { INTEGRATION_TYPES } = await import("../src/hooks/types");
    const cwd = decodeFolderName(projectName);
    const allActivity = getAllHookActivityEntries();
    const VIRTUAL_INTEGRATIONS = INTEGRATION_TYPES as unknown as string[];
    const matchingEntries = allActivity.filter(
      (entry) =>
        entry.sessionId === sessionId &&
        VIRTUAL_INTEGRATIONS.includes(entry.integration || ""),
    );
    if (matchingEntries.length > 0) {
      const nativePath = matchingEntries
        .map((entry) => entry.transcriptPath)
        .find((p): p is string => typeof p === "string" && p.length > 0);
      if (nativePath) {
        const native = await parseNativeTranscript(nativePath);
        if (native) return native;
      }
      // Try mirrored JSONL (has proper pre/post tool pairing via writeVirtualLogEntry sidecar)
      let mirroredEntries: LogEntry[] = [];
      let usedMirrored = false;
      const mirroredPath = join(resolveProjectPath(projectName), `${sessionId}.jsonl`);
      try {
        const mirroredContent = await readFile(mirroredPath, "utf-8");
        const parsed = await parseFileContent(mirroredContent, "session");
        mirroredEntries = parsed.entries;
        usedMirrored = true;
      } catch {
        // mirrored file absent — will use activity store
      }

      // Always use activity store as source of truth for complete coverage, but prefer tool pairing from mirrored file
      const activityEntries = matchingEntries.map(mapActivityEntryToLogEntry);

      // If mirrored file exists, use it for proper tool pairing, then merge activity entries
      let allEntries: LogEntry[];
      if (usedMirrored && mirroredEntries.length > 0) {
        // Mirrored entries contain allowed tool events (proper tool result pairing from pre/post hooks).
        // Activity store has ALL events (allow, deny, instruct, lifecycle).
        // Deduplicate: skip activity entries that are already in mirrored (same tool+timestamp).
        const mirroredToolKeys = new Set(
          mirroredEntries
            .filter((e): e is AssistantEntry => e.type === "assistant")
            .map(e => {
              const content = (e as AssistantEntry).message.content[0];
              return content?.type === "tool_use" ? `${content.name}:${e.timestampMs}` : null;
            })
            .filter((key): key is string => key !== null)
        );

        const nonDuplicateActivityEntries = activityEntries.filter(e => {
          if (e.type !== "assistant") return true; // always include non-assistant entries
          const content = e.message.content[0];
          if (content?.type === "tool_use") {
            // Skip if this tool event is already in mirrored (successful execution)
            const key = `${content.name}:${e.timestampMs}`;
            return !mirroredToolKeys.has(key);
          }
          return true; // include non-tool assistant entries (lifecycle, text, etc.)
        });

        allEntries = [...mirroredEntries, ...nonDuplicateActivityEntries];
      } else {
        // No mirrored file or empty — use activity store directly
        allEntries = activityEntries;
      }

      allEntries.sort((a, b) => a.timestampMs - b.timestampMs);
      return {
        entries: allEntries,
        rawLines: [],
        subagentIds: [],
        sourceMode: usedMirrored ? "native" : "fallback",
        sourceDetail: usedMirrored ? mirroredPath : "virtual-activity-store",
      };
    }
  }

  // Defense-in-depth: validate path even though callers should have already done so.
  const projectDir = resolveProjectPath(projectName);
  const projectsPath = getClaudeProjectsPath();
  const filePath = join(projectDir, `${sessionId}.jsonl`);

  let fileContent: string;
  let sourcePathUsed = filePath;
  try {
    fileContent = await readFile(filePath, "utf-8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;

    if (UUID_RE.test(projectName)) {
      const copilotDir = resolveCopilotSessionDir(projectName);
      const copilotEventsPath = join(copilotDir, "events.jsonl");
      // Let this throw naturally (ENOENT) if the Copilot session doesn't exist either.
      fileContent = await readFile(copilotEventsPath, "utf-8");
      sourcePathUsed = copilotEventsPath;
    } else {
      throw e; // not Claude/Copilot file and no virtual activity match
    }
  }

  const { entries: sessionEntries, rawLines: sessionRawLines, subagentIds } =
    await parseFileContent(fileContent, "session");

  if (subagentIds.length === 0) {
    return { entries: sessionEntries, rawLines: sessionRawLines, subagentIds: [], sourceMode: "native", sourceDetail: sourcePathUsed };
  }

  // Load subagent files with bounded concurrency to avoid file-descriptor pressure.
  const results = await batchAll(
    subagentIds.map((agentId) => async () => {
      const agentSource: LogSource = `agent-${agentId}`;
      const agentPath = await resolveSubagentPath(projectsPath, projectName, sessionId, agentId);
      if (!agentPath) return null;
      const agentContent = await readFile(agentPath, "utf-8");
      const { entries, rawLines } = await parseFileContent(agentContent, agentSource);
      return { entries, rawLines };
    }),
    SUBAGENT_CONCURRENCY,
  );

  // Combine all entries and rawLines
  const allEntries = [...sessionEntries];
  const allRawLines = [...sessionRawLines];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      allEntries.push(...result.value.entries);
      allRawLines.push(...result.value.rawLines);
    }
  }

  // Yield before sort for large combined arrays
  if (allEntries.length > 500) await new Promise<void>(r => setImmediate(r));

  // Sort combined entries by timestamp
  allEntries.sort((a, b) => a.timestampMs - b.timestampMs);

  return { entries: allEntries, rawLines: allRawLines, subagentIds, sourceMode: "native", sourceDetail: sourcePathUsed };
}

export const getCachedSessionLog = runtimeCache(
  (projectName: string, sessionId: string) => parseSessionLog(projectName, sessionId),
  60,
  { maxSize: 50 },
);
