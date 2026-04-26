import { readFile, readdir, stat } from "fs/promises";
import { existsSync, readFileSync } from "fs";
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

function getHomeDir(): string {
  return process.env.HOME && process.env.HOME.trim().length > 0 ? process.env.HOME : homedir();
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

function stableJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(rec[k])}`).join(",")}}`;
}

function normalizeTextForKey(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getEntrySignature(entry: LogEntry): string {
  if (entry.type === "user") {
    return `user:${normalizeTextForKey(entry.message.content)}`;
  }

  if (entry.type === "assistant") {
    const blocks = entry.message.content;
    if (blocks.length === 0) return "assistant:empty";
    const blockSigs = blocks.map((block) => {
      if (block.type === "text") {
        return `text:${normalizeTextForKey(block.text)}`;
      }
      if (block.type === "thinking") {
        return `thinking:${normalizeTextForKey(block.thinking)}`;
      }
      const resultContent = normalizeTextForKey(block.result?.content);
      const isPolicyDecision =
        resultContent.includes("mandatory action required from failproofai")
        || resultContent.includes("[failproofai instruction]")
        || resultContent.includes("action blocked by failproofai")
        || resultContent.includes("[failproofai security stop]");
      const toolClass = isPolicyDecision ? "policy" : "ok";
      return `tool:${block.name}:${stableJson(block.input)}:${toolClass}`;
    });
    return `assistant:${blockSigs.join("|")}`;
  }

  if (entry.type === "queue-operation") {
    return `queue:${entry.label}`;
  }

  if (entry.type === "system") {
    return `system:${stableJson(entry.raw)}`;
  }

  return `${entry.type}:${stableJson(entry.raw)}`;
}

function mergeMirroredAndActivityEntries(
  mirroredEntries: LogEntry[],
  activityEntries: LogEntry[],
): LogEntry[] {
  const BUCKET_MS = 2000;
  const seen = new Set<string>();

  const markSeen = (entry: LogEntry): void => {
    const sig = getEntrySignature(entry);
    const bucket = Math.floor(entry.timestampMs / BUCKET_MS);
    seen.add(`${sig}|${bucket}`);
    seen.add(`${sig}|${bucket - 1}`);
    seen.add(`${sig}|${bucket + 1}`);
  };

  for (const entry of mirroredEntries) {
    markSeen(entry);
  }

  const nonDuplicateActivityEntries = activityEntries.filter((entry) => {
    const sig = getEntrySignature(entry);
    const bucket = Math.floor(entry.timestampMs / BUCKET_MS);
    return !seen.has(`${sig}|${bucket}`);
  });

  const allEntries = [...mirroredEntries, ...nonDuplicateActivityEntries];
  allEntries.sort((a, b) => a.timestampMs - b.timestampMs);
  return allEntries;
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
    if (role && role !== "assistant" && role !== "model" && role !== "ai" && role !== "gemini") {
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

// ── Native Format Detection ──

function detectNativeFormat(firstLine: string): "cursor" | "copilot" | "pi" | "codex" | "gemini-jsonl" | "unknown" {
  try {
    const obj = JSON.parse(firstLine) as Record<string, unknown>;
    if (!obj || typeof obj !== "object") return "unknown";
    // Cursor: top-level keys are "role" and "message", no "type" key
    if ("role" in obj && "message" in obj && !("type" in obj)) return "cursor";
    if ("type" in obj && typeof obj.type === "string") {
      const t = obj.type as string;
      if (t === "session.start" || t.startsWith("session.")) return "copilot";
      if (t === "session" && "version" in obj) return "pi";
      if (t === "session_meta") return "codex";
    }
    // Gemini JSONL header line has sessionId + projectHash (or kind)
    if ("sessionId" in obj && ("projectHash" in obj || "kind" in obj)) return "gemini-jsonl";
  } catch {
    // ignore parse error
  }
  return "unknown";
}

// ── CLI-Specific Parsers ──

function parseCursorFile(content: string, source: LogSource, fileDate: Date): ParseFileResult {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  const rawLines: Record<string, unknown>[] = [];
  const parsed: Array<Record<string, unknown>> = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      rawLines.push({ ...obj, _source: source });
      parsed.push(obj);
    } catch {
      continue;
    }
  }

  const entries: LogEntry[] = [];
  let lastAssistantWithTool: AssistantEntry | null = null;

  for (let i = 0; i < parsed.length; i++) {
    const obj = parsed[i];
    const role = obj.role as string | undefined;
    const message = obj.message as Record<string, unknown> | undefined;
    const contentBlocks = Array.isArray(message?.content)
      ? (message.content as Array<Record<string, unknown>>)
      : [];

    // Synthetic timestamps (2s apart) since Cursor JSONL has no timestamps
    const tsMs = fileDate.getTime() - (parsed.length - i) * 2000;
    const date = new Date(tsMs);
    const timestamp = date.toISOString();
    const base = {
      _source: source,
      uuid: `cursor-${i}`,
      parentUuid: i > 0 ? `cursor-${i - 1}` : null,
      timestamp,
      timestampMs: tsMs,
      timestampFormatted: formatTimestamp(date),
    };

    if (role === "user") {
      lastAssistantWithTool = null;
      let textContent = contentBlocks
        .filter((b) => b.type === "text")
        .map((b) => b.text as string)
        .join("\n")
        .trim();
      // Strip <user_query> wrapper tags that Cursor sometimes injects
      if (textContent.startsWith("<user_query>")) {
        textContent = textContent.replace(/^<user_query>\s*/, "").replace(/\s*<\/user_query>$/, "");
      }
      if (textContent) {
        entries.push({ type: "user", ...base, message: { role: "user", content: textContent } } as UserEntry);
      }
      continue;
    }

    if (role === "assistant") {
      const hasToolUse = contentBlocks.some((b) => b.type === "tool_use");
      const onlyText = !hasToolUse && contentBlocks.some((b) => b.type === "text");

      // Text-only assistant entry right after a tool_use is actually the tool result
      if (onlyText && lastAssistantWithTool) {
        const textContent = contentBlocks
          .filter((b) => b.type === "text")
          .map((b) => b.text as string)
          .join("\n")
          .trim();
        if (textContent) {
          const toolBlocks = lastAssistantWithTool.message.content.filter(
            (b): b is ToolUseBlock => b.type === "tool_use",
          );
          if (toolBlocks.length > 0) {
            const lastTool = toolBlocks[toolBlocks.length - 1];
            const durationMs = Math.max(0, tsMs - lastAssistantWithTool.timestampMs);
            lastTool.result = {
              timestamp,
              timestampFormatted: formatTimestamp(date),
              content: textContent,
              durationMs,
              durationFormatted: formatDuration(durationMs),
            };
          }
        }
        lastAssistantWithTool = null;
        continue;
      }

      const mappedContent: ContentBlock[] = contentBlocks
        .filter((b) => b.type === "text" || b.type === "tool_use")
        .map((b) => {
          if (b.type === "text") return { type: "text" as const, text: (b.text as string) || "" };
          return {
            type: "tool_use" as const,
            id: (b.id as string) || `cursor-tool-${i}`,
            name: (b.name as string) || "unknown",
            input: (b.input as Record<string, unknown>) || {},
          };
        });

      if (mappedContent.length > 0) {
        const entry: AssistantEntry = {
          type: "assistant",
          ...base,
          message: { role: "assistant", content: mappedContent },
        };
        entries.push(entry);
        lastAssistantWithTool = hasToolUse ? entry : null;
      }
    }
  }

  return { entries, rawLines, subagentIds: [] };
}

function parseCopilotEventsFile(content: string, source: LogSource): ParseFileResult {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  const rawLines: Record<string, unknown>[] = [];
  const allObjects: Array<Record<string, unknown>> = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      rawLines.push({ ...obj, _source: source });
      allObjects.push(obj);
    } catch {
      continue;
    }
  }

  // Build tool result map keyed by toolCallId
  const toolResultMap = new Map<string, { content: string; timestamp: string; timestampMs: number }>();
  for (const obj of allObjects) {
    if (obj.type !== "tool.execution_complete") continue;
    const data = obj.data as Record<string, unknown> | undefined;
    if (!data) continue;
    const toolCallId = data.toolCallId as string | undefined;
    if (!toolCallId) continue;
    const date = normalizeTimestamp(obj.timestamp) ?? new Date();
    const resultContent = data.success !== false
      ? (data.output ?? data.result ?? "")
      : `Error: ${JSON.stringify(data.error ?? "Tool failed")}`;
    toolResultMap.set(toolCallId, {
      content: stringifyStructured(resultContent) ?? "",
      timestamp: date.toISOString(),
      timestampMs: date.getTime(),
    });
  }

  const entries: LogEntry[] = [];

  for (const obj of allObjects) {
    const type = obj.type as string;
    const date = normalizeTimestamp(obj.timestamp) ?? new Date();
    const timestamp = date.toISOString();
    const base = {
      _source: source,
      uuid: (obj.id as string) || `copilot-${date.getTime()}`,
      parentUuid: (obj.parentId as string | null) ?? null,
      timestamp,
      timestampMs: date.getTime(),
      timestampFormatted: formatTimestamp(date),
    };

    if (type === "user.message") {
      const data = obj.data as Record<string, unknown> | undefined;
      const text = stringifyStructured(data?.content ?? data?.message ?? data?.text ?? "") ?? "";
      if (text) {
        entries.push({ type: "user", ...base, message: { role: "user", content: text } } as UserEntry);
      }
      continue;
    }

    if (type === "hook.start") {
      const data = obj.data as Record<string, unknown> | undefined;
      if (data?.hookType === "userPromptSubmitted") {
        const input = data.input as Record<string, unknown> | undefined;
        const text = stringifyStructured(input?.prompt ?? input?.content ?? "") ?? "";
        if (text) {
          entries.push({ type: "user", ...base, message: { role: "user", content: text } } as UserEntry);
        }
      }
      continue;
    }

    if (type === "assistant.message") {
      const data = obj.data as Record<string, unknown> | undefined;
      if (!data) continue;
      const textContent = typeof data.content === "string" ? data.content : "";
      const toolRequests = Array.isArray(data.toolRequests)
        ? (data.toolRequests as Array<Record<string, unknown>>)
        : [];

      const contentBlocks: ContentBlock[] = [];
      if (textContent.trim()) {
        contentBlocks.push({ type: "text", text: textContent });
      }

      for (const req of toolRequests) {
        const id = ((req.id ?? req.toolCallId) as string) || `copilot-tool-${date.getTime()}`;
        const name = ((req.name ?? req.toolName) as string) || "unknown";
        const rawInput = req.arguments ?? req.input ?? {};
        let input: Record<string, unknown>;
        if (typeof rawInput === "string") {
          try { input = JSON.parse(rawInput) as Record<string, unknown>; }
          catch { input = { command: rawInput }; }
        } else {
          input = rawInput as Record<string, unknown>;
        }

        const toolUse: ToolUseBlock = { type: "tool_use", id, name, input };
        const resultInfo = toolResultMap.get(id);
        if (resultInfo) {
          const durationMs = Math.max(0, resultInfo.timestampMs - date.getTime());
          const resultDate = new Date(resultInfo.timestamp);
          toolUse.result = {
            timestamp: resultInfo.timestamp,
            timestampFormatted: formatTimestamp(resultDate),
            content: resultInfo.content,
            durationMs,
            durationFormatted: formatDuration(durationMs),
          };
        }
        contentBlocks.push(toolUse);
      }

      if (contentBlocks.length > 0) {
        entries.push({
          type: "assistant",
          ...base,
          message: { role: "assistant", content: contentBlocks },
        } as AssistantEntry);
      }
      continue;
    }
    // skip: session.start, assistant.turn_start/end, session.shutdown, hook.end, tool.execution_complete
  }

  entries.sort((a, b) => a.timestampMs - b.timestampMs);
  return { entries, rawLines, subagentIds: [] };
}

function parsePiFile(content: string, source: LogSource): ParseFileResult {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  const rawLines: Record<string, unknown>[] = [];
  const allObjects: Array<Record<string, unknown>> = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      rawLines.push({ ...obj, _source: source });
      allObjects.push(obj);
    } catch {
      continue;
    }
  }

  // Build tool result map from role:"toolResult" entries keyed by toolCallId
  const toolResultMap = new Map<string, { content: string; isError: boolean; timestamp: string; timestampMs: number }>();
  for (const obj of allObjects) {
    if (obj.type !== "message") continue;
    const msg = obj.message as Record<string, unknown> | undefined;
    if (!msg || msg.role !== "toolResult") continue;
    const toolCallId = msg.toolCallId as string | undefined;
    if (!toolCallId) continue;
    const date = normalizeTimestamp(obj.timestamp ?? msg.timestamp) ?? new Date();
    const contentArr = Array.isArray(msg.content) ? (msg.content as Array<Record<string, unknown>>) : [];
    const contentText = contentArr.filter((c) => c.type === "text").map((c) => c.text as string).join("\n");
    toolResultMap.set(toolCallId, {
      content: contentText,
      isError: !!msg.isError,
      timestamp: date.toISOString(),
      timestampMs: date.getTime(),
    });
  }

  const entries: LogEntry[] = [];

  for (const obj of allObjects) {
    if (obj.type !== "message") continue;
    const msg = obj.message as Record<string, unknown> | undefined;
    if (!msg) continue;
    const role = msg.role as string | undefined;
    if (role === "toolResult") continue; // consumed in toolResultMap

    const date = normalizeTimestamp(obj.timestamp ?? msg.timestamp) ?? new Date();
    const timestamp = date.toISOString();
    const base = {
      _source: source,
      uuid: (obj.id as string) || `pi-${date.getTime()}`,
      parentUuid: (obj.parentId as string | null) ?? null,
      timestamp,
      timestampMs: date.getTime(),
      timestampFormatted: formatTimestamp(date),
    };

    const contentArr = Array.isArray(msg.content) ? (msg.content as Array<Record<string, unknown>>) : [];

    if (role === "user") {
      const textContent = contentArr.filter((c) => c.type === "text").map((c) => c.text as string).join("\n").trim();
      if (textContent) {
        entries.push({ type: "user", ...base, message: { role: "user", content: textContent } } as UserEntry);
      }
      continue;
    }

    if (role === "assistant") {
      const contentBlocks: ContentBlock[] = [];
      for (const block of contentArr) {
        if (block.type === "text") {
          const text = (block.text as string) || "";
          if (text.trim()) contentBlocks.push({ type: "text", text });
        } else if (block.type === "toolCall") {
          const id = (block.id as string) || `pi-tool-${date.getTime()}`;
          const name = (block.name as string) || "unknown";
          const input = (block.arguments as Record<string, unknown>) || {};
          const toolUse: ToolUseBlock = { type: "tool_use", id, name, input };
          const resultInfo = toolResultMap.get(id);
          if (resultInfo) {
            const durationMs = Math.max(0, resultInfo.timestampMs - date.getTime());
            const resultDate = new Date(resultInfo.timestamp);
            toolUse.result = {
              timestamp: resultInfo.timestamp,
              timestampFormatted: formatTimestamp(resultDate),
              content: resultInfo.content,
              durationMs,
              durationFormatted: formatDuration(durationMs),
            };
          }
          contentBlocks.push(toolUse);
        }
        // skip thoughtSignature (encrypted bytes — not displayable)
      }
      if (contentBlocks.length > 0) {
        entries.push({
          type: "assistant",
          ...base,
          message: { role: "assistant", content: contentBlocks, model: msg.model as string | undefined },
        } as AssistantEntry);
      }
    }
  }

  entries.sort((a, b) => a.timestampMs - b.timestampMs);
  return { entries, rawLines, subagentIds: [] };
}

function parseCodexFile(content: string, source: LogSource): ParseFileResult {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  const rawLines: Record<string, unknown>[] = [];
  const allObjects: Array<Record<string, unknown>> = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      rawLines.push({ ...obj, _source: source });
      allObjects.push(obj);
    } catch {
      continue;
    }
  }

  // Build tool result map from exec_command_end events keyed by call_id
  const toolResultMap = new Map<string, { content: string; timestamp: string; timestampMs: number }>();
  for (const obj of allObjects) {
    if (obj.type !== "event_msg") continue;
    const payload = obj.payload as Record<string, unknown> | undefined;
    if (!payload || payload.type !== "exec_command_end") continue;
    const callId = payload.call_id as string | undefined;
    if (!callId) continue;
    const date = normalizeTimestamp(obj.timestamp) ?? new Date();
    const stdout = (payload.stdout as string) || "";
    const stderr = (payload.stderr as string) || "";
    const resultText = [stdout, stderr].filter(Boolean).join("\n") || `Exit code: ${payload.exit_code ?? 0}`;
    toolResultMap.set(callId, { content: resultText, timestamp: date.toISOString(), timestampMs: date.getTime() });
  }

  const entries: LogEntry[] = [];
  let counter = 0;

  for (const obj of allObjects) {
    const type = obj.type as string;
    const payload = obj.payload as Record<string, unknown> | undefined;
    if (!payload) continue;

    const date = normalizeTimestamp(obj.timestamp) ?? new Date();
    const timestamp = date.toISOString();
    const base = {
      _source: source,
      uuid: `codex-${date.getTime()}-${counter++}`,
      parentUuid: null,
      timestamp,
      timestampMs: date.getTime(),
      timestampFormatted: formatTimestamp(date),
    };

    if (type === "response_item") {
      const payloadType = payload.type as string;
      const role = payload.role as string | undefined;

      if (payloadType === "message" && role === "user") {
        const contentArr = Array.isArray(payload.content) ? (payload.content as Array<Record<string, unknown>>) : [];
        const text = contentArr
          .filter((c) => c.type === "input_text" || c.type === "text")
          .map((c) => c.text as string)
          .join("\n")
          .trim();
        // Skip system prompt injections (start with XML tags)
        if (text && !text.startsWith("<")) {
          entries.push({ type: "user", ...base, message: { role: "user", content: text } } as UserEntry);
        }
        continue;
      }

      if (payloadType === "message" && role === "assistant") {
        const contentArr = Array.isArray(payload.content) ? (payload.content as Array<Record<string, unknown>>) : [];
        const text = contentArr
          .filter((c) => c.type === "output_text" || c.type === "text")
          .map((c) => c.text as string)
          .join("\n")
          .trim();
        if (text) {
          entries.push({
            type: "assistant",
            ...base,
            message: { role: "assistant", content: [{ type: "text", text }] },
          } as AssistantEntry);
        }
        continue;
      }

      if (payloadType === "function_call") {
        const callId = payload.call_id as string | undefined;
        const name = (payload.name as string) || "unknown";
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse((payload.arguments as string) || "{}") as Record<string, unknown>;
        } catch {
          input = { arguments: payload.arguments };
        }
        const toolUse: ToolUseBlock = {
          type: "tool_use",
          id: callId || `codex-call-${date.getTime()}`,
          name,
          input,
        };
        if (callId) {
          const resultInfo = toolResultMap.get(callId);
          if (resultInfo) {
            const durationMs = Math.max(0, resultInfo.timestampMs - date.getTime());
            const resultDate = new Date(resultInfo.timestamp);
            toolUse.result = {
              timestamp: resultInfo.timestamp,
              timestampFormatted: formatTimestamp(resultDate),
              content: resultInfo.content,
              durationMs,
              durationFormatted: formatDuration(durationMs),
            };
          }
        }
        entries.push({ type: "assistant", ...base, message: { role: "assistant", content: [toolUse] } } as AssistantEntry);
        continue;
      }
      continue;
    }

    if (type === "event_msg" && (payload.type as string) === "agent_message") {
      const text = (payload.message as string) || "";
      if (text.trim()) {
        entries.push({ type: "assistant", ...base, message: { role: "assistant", content: [{ type: "text", text }] } } as AssistantEntry);
      }
      continue;
    }
    // skip: session_meta, turn_context, other event_msg types
  }

  entries.sort((a, b) => a.timestampMs - b.timestampMs);
  return { entries, rawLines, subagentIds: [] };
}

function parseGeminiFile(content: string, source: LogSource): ParseFileResult {
  const trimmed = content.trim();
  const rawLines: Record<string, unknown>[] = [];
  let messageObjects: Array<Record<string, unknown>> = [];

  // Try JSON wrapper format first (older Gemini .json files with top-level messages array)
  if (trimmed.startsWith("{") && !trimmed.includes("\n{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (Array.isArray(parsed.messages)) {
        messageObjects = parsed.messages as Array<Record<string, unknown>>;
        rawLines.push({ ...parsed, _source: source });
      }
    } catch {
      // Not valid JSON, fall through to JSONL
    }
  }

  if (messageObjects.length === 0) {
    const lines = trimmed.split("\n").filter((l) => l.trim() !== "");
    for (const line of lines) {
      try {
        const obj = JSON.parse(line) as Record<string, unknown>;
        rawLines.push({ ...obj, _source: source });
        if ("$set" in obj) continue; // metadata update, skip
        if (obj.sessionId && !obj.type && !obj.id) continue; // header line
        const t = obj.type as string | undefined;
        if (t === "warning" || t === "info") continue;
        if (obj.id || obj.type) messageObjects.push(obj);
      } catch {
        continue;
      }
    }
  }

  const entries: LogEntry[] = [];

  for (const obj of messageObjects) {
    const type = obj.type as string | undefined;
    const date = normalizeTimestamp(obj.timestamp) ?? new Date();
    const timestamp = date.toISOString();
    const base = {
      _source: source,
      uuid: (obj.id as string) || `gemini-${date.getTime()}`,
      parentUuid: null,
      timestamp,
      timestampMs: date.getTime(),
      timestampFormatted: formatTimestamp(date),
    };

    if (type === "user") {
      let textContent = "";
      if (Array.isArray(obj.content)) {
        textContent = (obj.content as Array<Record<string, unknown>>).map((c) => (c.text as string) ?? "").join("\n").trim();
      } else if (typeof obj.content === "string") {
        textContent = obj.content.trim();
      }
      if (textContent) {
        entries.push({ type: "user", ...base, message: { role: "user", content: textContent } } as UserEntry);
      }
      continue;
    }

    if (type === "gemini" || type === "assistant" || type === "model") {
      const contentBlocks: ContentBlock[] = [];

      // LLM text
      let textContent = "";
      if (typeof obj.content === "string") {
        textContent = obj.content.trim();
      } else if (Array.isArray(obj.content)) {
        textContent = (obj.content as Array<Record<string, unknown>>).filter((c) => c.text).map((c) => c.text as string).join("\n").trim();
      }
      if (textContent) contentBlocks.push({ type: "text", text: textContent });

      // Thoughts array → ThinkingBlocks
      const thoughts = Array.isArray(obj.thoughts) ? (obj.thoughts as Array<Record<string, unknown>>) : [];
      for (const thought of thoughts) {
        const subject = (thought.subject as string) || "";
        const description = (thought.description as string) || "";
        const thinkingText = [subject, description].filter(Boolean).join(": ");
        if (thinkingText) contentBlocks.push({ type: "thinking", thinking: thinkingText });
      }

      // Tool calls with inline results embedded in the same entry
      const toolCalls = Array.isArray(obj.toolCalls) ? (obj.toolCalls as Array<Record<string, unknown>>) : [];
      for (const tc of toolCalls) {
        const id = (tc.id as string) || `gemini-tool-${date.getTime()}`;
        const name = (tc.name as string) || "unknown";
        const input = (tc.args as Record<string, unknown>) || {};
        const toolUse: ToolUseBlock = { type: "tool_use", id, name, input };

        const resultArr = Array.isArray(tc.result) ? (tc.result as Array<Record<string, unknown>>) : [];
        if (resultArr.length > 0) {
          const funcResp = resultArr[0].functionResponse as Record<string, unknown> | undefined;
          const response = funcResp?.response as Record<string, unknown> | undefined;
          const resultText = stringifyStructured(response?.output ?? response?.error ?? response ?? resultArr[0]);
          if (resultText) {
            toolUse.result = {
              timestamp,
              timestampFormatted: formatTimestamp(date),
              content: resultText,
              durationMs: 0,
              durationFormatted: formatDuration(0),
            };
          }
        }
        contentBlocks.push(toolUse);
      }

      if (contentBlocks.length > 0) {
        entries.push({
          type: "assistant",
          ...base,
          message: { role: "assistant", content: contentBlocks, model: obj.model as string | undefined },
        } as AssistantEntry);
      }
      continue;
    }
  }

  entries.sort((a, b) => a.timestampMs - b.timestampMs);
  return { entries, rawLines, subagentIds: [] };
}

async function parseOpencodeDbSession(sessionId: string): Promise<ParseFileResult | null> {
  const dbPath = join(getHomeDir(), ".local", "share", "opencode", "opencode.db");
  try {
    if (process.env.VITEST) return null;
    // bun:sqlite is only available in Bun runtime; gracefully returns null in Node/tests
    const bunSqliteSpecifier = `bun${":sqlite"}`;
    const mod = await import(bunSqliteSpecifier as unknown as string) as any;
    const db: any = new mod.Database(dbPath, { readonly: true });
    try {
      const rows = db.query(`
        SELECT m.id AS msg_id, m.data AS msg_data, m.time_created AS msg_time,
               p.data AS part_data, p.time_created AS part_time
        FROM message m
        LEFT JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
        ORDER BY m.time_created, p.time_created
      `).all(sessionId) as Array<Record<string, unknown>>;

      if (rows.length === 0) return null;

      const messageMap = new Map<string, {
        role: string;
        model?: string;
        time: number;
        parts: Array<{ type: string; text?: string; toolData?: Record<string, unknown>; partTime: number }>;
      }>();

      for (const row of rows) {
        const msgId = row.msg_id as string;
        const msgData = JSON.parse(row.msg_data as string) as Record<string, unknown>;
        const role = msgData.role as string;
        const timeRaw = (msgData.time as Record<string, unknown> | undefined)?.created;
        const time = (typeof timeRaw === "number" ? timeRaw : null) ?? (row.msg_time as number) ?? 0;

        if (!messageMap.has(msgId)) {
          messageMap.set(msgId, { role, model: msgData.modelID as string | undefined, time, parts: [] });
        }

        const partDataStr = row.part_data as string | undefined;
        if (partDataStr) {
          const part = JSON.parse(partDataStr) as Record<string, unknown>;
          const partTime = (row.part_time as number) || time;
          const msgEntry = messageMap.get(msgId)!;
          if (part.type === "text") {
            msgEntry.parts.push({ type: "text", text: part.text as string, partTime });
          } else if (part.type === "tool") {
            msgEntry.parts.push({ type: "tool", toolData: part as Record<string, unknown>, partTime });
          }
          // skip step-start, step-finish
        }
      }

      const entries: LogEntry[] = [];

      for (const [, msgEntry] of messageMap) {
        const date = new Date(msgEntry.time);
        const timestamp = date.toISOString();
        const base = {
          _source: "session" as LogSource,
          uuid: `opencode-${msgEntry.time}`,
          parentUuid: null,
          timestamp,
          timestampMs: date.getTime(),
          timestampFormatted: formatTimestamp(date),
        };

        if (msgEntry.role === "user") {
          const textParts = msgEntry.parts.filter((p) => p.type === "text").map((p) => p.text || "").join("\n").trim();
          if (textParts) {
            entries.push({ type: "user", ...base, message: { role: "user", content: textParts } } as UserEntry);
          }
          continue;
        }

        if (msgEntry.role === "assistant") {
          const contentBlocks: ContentBlock[] = [];
          for (const part of msgEntry.parts) {
            if (part.type === "text" && part.text?.trim()) {
              contentBlocks.push({ type: "text", text: part.text.trim() });
            } else if (part.type === "tool" && part.toolData) {
              const td = part.toolData;
              const state = td.state as Record<string, unknown> | undefined;
              const toolUse: ToolUseBlock = {
                type: "tool_use",
                id: (td.callID as string) || `opencode-tool-${part.partTime}`,
                name: (td.tool as string) || "unknown",
                input: (state?.input as Record<string, unknown>) || {},
              };
              const output = (state?.output as string) ?? (state?.error as string);
              const stateTime = state?.time as Record<string, unknown> | undefined;
              const timeStart = stateTime?.start as number | undefined;
              const timeEnd = stateTime?.end as number | undefined;
              const durationMs = timeStart != null && timeEnd != null ? Math.max(0, timeEnd - timeStart) : 0;
              if (output !== undefined) {
                const resultDate = timeEnd != null ? new Date(timeEnd) : date;
                toolUse.result = {
                  timestamp: resultDate.toISOString(),
                  timestampFormatted: formatTimestamp(resultDate),
                  content: output,
                  durationMs,
                  durationFormatted: formatDuration(durationMs),
                };
              }
              contentBlocks.push(toolUse);
            }
          }
          if (contentBlocks.length > 0) {
            entries.push({
              type: "assistant",
              ...base,
              message: { role: "assistant", content: contentBlocks, model: msgEntry.model },
            } as AssistantEntry);
          }
        }
      }

      entries.sort((a, b) => a.timestampMs - b.timestampMs);
      return { entries, rawLines: [], subagentIds: [] };
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

async function findGeminiTranscriptPath(cwd: string, sessionId: string): Promise<string | null> {
  const geminiRoot = join(getHomeDir(), ".gemini");
  let projectName: string | undefined;
  try {
    const projectsJsonPath = join(geminiRoot, "projects.json");
    if (existsSync(projectsJsonPath)) {
      const data = JSON.parse(readFileSync(projectsJsonPath, "utf-8")) as Record<string, unknown>;
      const projects = data.projects as Record<string, string> | undefined;
      if (projects) projectName = projects[cwd];
    }
  } catch {
    // continue without project name
  }

  const searchRoots: string[] = [];
  if (projectName) searchRoots.push(join(geminiRoot, "tmp", projectName, "chats"));
  try {
    const tmpDir = join(geminiRoot, "tmp");
    const dirs = await readdir(tmpDir, { withFileTypes: true });
    for (const d of dirs) {
      if (d.isDirectory()) {
        const chatsDir = join(tmpDir, d.name, "chats");
        if (!searchRoots.includes(chatsDir)) searchRoots.push(chatsDir);
      }
    }
  } catch {
    // tmp dir absent
  }

  for (const chatsDir of searchRoots) {
    try {
      const files = await readdir(chatsDir, { withFileTypes: true });
      const preferred = files.find(
        (f) =>
          f.isFile() &&
          f.name.includes(sessionId) &&
          f.name.endsWith(".jsonl") &&
          !f.name.endsWith(".jsonl.tool-calls.json"),
      );
      const fallback = files.find(
        (f) =>
          f.isFile() &&
          f.name.includes(sessionId) &&
          f.name.endsWith(".json") &&
          !f.name.endsWith(".jsonl.tool-calls.json"),
      );
      const match = preferred ?? fallback;
      if (match) return join(chatsDir, match.name);
    } catch {
      continue;
    }
  }
  return null;
}

async function findPiTranscriptPath(_cwd: string, sessionId: string): Promise<string | null> {
  const sessionsDir = join(getHomeDir(), ".pi", "agent", "sessions");
  try {
    const cwdDirs = await readdir(sessionsDir, { withFileTypes: true });
    for (const cwdDir of cwdDirs) {
      if (!cwdDir.isDirectory()) continue;
      const sessionDirPath = join(sessionsDir, cwdDir.name);
      const files = await readdir(sessionDirPath, { withFileTypes: true });
      const match = files.find((f) => f.isFile() && f.name.includes(sessionId) && f.name.endsWith(".jsonl"));
      if (match) return join(sessionDirPath, match.name);
    }
  } catch {
    // Pi sessions dir absent
  }
  return null;
}

async function parseNativeTranscript(
  transcriptPath: string,
  source: LogSource = "session",
): Promise<SessionLogData | null> {
  try {
    const content = await readFile(transcriptPath, "utf-8");
    const trimmed = content.trim();
    if (!trimmed) return null;

    // Detect format from first non-empty line and dispatch to dedicated parsers
    const firstLine = trimmed.split("\n")[0] ?? "";
    const format = detectNativeFormat(firstLine);

    if (format !== "unknown") {
      let result: ParseFileResult | null = null;
      if (format === "cursor") {
        const fileDate = await stat(transcriptPath).then((s) => s.mtime).catch(() => new Date());
        result = parseCursorFile(content, source, fileDate);
      } else if (format === "copilot") {
        result = parseCopilotEventsFile(content, source);
      } else if (format === "pi") {
        result = parsePiFile(content, source);
      } else if (format === "codex") {
        result = parseCodexFile(content, source);
      } else if (format === "gemini-jsonl") {
        result = parseGeminiFile(content, source);
      }
      if (result && result.entries.length > 0) {
        return {
          entries: result.entries,
          rawLines: result.rawLines,
          subagentIds: result.subagentIds,
          sourceMode: "native",
          sourceDetail: transcriptPath,
        };
      }
    }

    // Generic fallback: try full JSON parse first, then JSONL
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        // Gemini JSON wrapper format (older .json files with top-level messages array)
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const rec = parsed as Record<string, unknown>;
          if (Array.isArray(rec.messages)) {
            const geminiResult = parseGeminiFile(content, source);
            if (geminiResult.entries.length > 0) {
              return { entries: geminiResult.entries, rawLines: geminiResult.rawLines, subagentIds: geminiResult.subagentIds, sourceMode: "native", sourceDetail: transcriptPath };
            }
          }
        }
        const entries = mapNativeJsonToEntries(parsed, source);
        if (entries.length > 0) {
          return { entries, rawLines: [], subagentIds: [], sourceMode: "native", sourceDetail: transcriptPath };
        }
      } catch {
        // Not a pure JSON document; continue with JSONL parser.
      }
    }
    const { entries, rawLines, subagentIds } = await parseFileContent(content, source);
    if (entries.length === 0) return null;
    return { entries, rawLines, subagentIds, sourceMode: "native", sourceDetail: transcriptPath };
  } catch {
    return null;
  }
}

function encodeCursorWorkspace(cwd: string): string {
  return cwd.replace(/^\/+/, "").replace(/[\\/]/g, "-");
}

async function findCodexTranscriptPath(sessionId: string): Promise<string | null> {
  const root = join(getHomeDir(), ".codex", "sessions");
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
    getHomeDir(),
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

  const geminiPath = await findGeminiTranscriptPath(cwd, sessionId);
  if (geminiPath) {
    const geminiNative = await parseNativeTranscript(geminiPath);
    if (geminiNative) return geminiNative;
  }

  const piPath = await findPiTranscriptPath(cwd, sessionId);
  if (piPath) {
    const piNative = await parseNativeTranscript(piPath);
    if (piNative) return piNative;
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
  // For Copilot UUID sessions, prefer native events.jsonl (contains assistant text),
  // then fall back to activity-store when unavailable.
  if (UUID_RE.test(projectName)) {
    const nativeCopilotPath = join(getCopilotSessionStatePath(), projectName, "events.jsonl");
    const nativeCopilot = await parseNativeTranscript(nativeCopilotPath);
    if (nativeCopilot) return nativeCopilot;

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
    const sid = sessionId.startsWith("ses_") ? sessionId : projectName;

    // Try OpenCode SQLite DB first (bun:sqlite; gracefully returns null in Node/tests)
    const dbResult = await parseOpencodeDbSession(sid);
    if (dbResult && dbResult.entries.length > 0) {
      return { entries: dbResult.entries, rawLines: dbResult.rawLines, subagentIds: dbResult.subagentIds, sourceMode: "native", sourceDetail: "opencode-db" };
    }

    const { getAllHookActivityEntries } = await import("../src/hooks/hook-activity-store");
    const allActivity = getAllHookActivityEntries();
    const matching = allActivity
      .filter((e) => (e.sessionId === sid || `ses_${e.sessionId}` === sid || e.sessionId === `ses_${sid}`) && e.integration === "opencode");
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

      // If mirrored file exists, use it for proper tool pairing, then merge activity entries.
      // We dedupe by entry signature + time buckets to collapse duplicate lifecycle
      // rows (e.g. agentStop vs Stop) and duplicate tool rows from dual sources.
      const allEntries = usedMirrored && mirroredEntries.length > 0
        ? mergeMirroredAndActivityEntries(mirroredEntries, activityEntries)
        : activityEntries.slice().sort((a, b) => a.timestampMs - b.timestampMs);
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
    void cwd; // used implicitly through tryKnownNativeTranscriptPaths above
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

      // If mirrored file exists, use it for proper tool pairing, then merge activity entries.
      // We dedupe by entry signature + time buckets to collapse duplicate lifecycle
      // rows (e.g. agentStop vs Stop) and duplicate tool rows from dual sources.
      const allEntries = usedMirrored && mirroredEntries.length > 0
        ? mergeMirroredAndActivityEntries(mirroredEntries, activityEntries)
        : activityEntries.slice().sort((a, b) => a.timestampMs - b.timestampMs);
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
