import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface CodexTraceRecord {
  timestamp: string;
  thread_id: string | null;
  tool_call: "exec_command" | "custom_tool_call";
  command: string;
}

const ISO_TIMESTAMP_RE = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/;
const THREAD_ID_RE = /\bthread[_-]?id[=: ]+([A-Za-z0-9._-]+)/i;

function parseEmbeddedJson(line: string): Record<string, unknown> | null {
  const start = line.indexOf("{");
  const end = line.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(line.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseCommand(line: string, json: Record<string, unknown> | null): string | null {
  const jsonCommand = json?.command;
  if (typeof jsonCommand === "string" && jsonCommand.trim()) {
    return jsonCommand;
  }

  const quotedCommandMatch =
    line.match(/\bcommand="([^"]+)"/) ??
    line.match(/\bcommand='([^']+)'/) ??
    line.match(/\bcommand=([^\s].+)$/);
  if (quotedCommandMatch?.[1]) {
    return quotedCommandMatch[1].trim();
  }

  return null;
}

function parseLine(line: string): CodexTraceRecord | null {
  if (!line.includes("ToolCall:")) return null;
  if (!line.includes("exec_command") && !line.includes("custom_tool_call")) return null;

  const tool_call: CodexTraceRecord["tool_call"] = line.includes("custom_tool_call")
    ? "custom_tool_call"
    : "exec_command";

  const timestamp = line.match(ISO_TIMESTAMP_RE)?.[0];
  if (!timestamp) return null;

  const thread_id = line.match(THREAD_ID_RE)?.[1] ?? null;
  const embeddedJson = parseEmbeddedJson(line);
  const command = parseCommand(line, embeddedJson);
  if (!command) return null;

  return { timestamp, thread_id, tool_call, command };
}

export function parseCodexLogToTraceRecords(content: string): CodexTraceRecord[] {
  const records: CodexTraceRecord[] = [];
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    const record = parseLine(line);
    if (record) records.push(record);
  }
  return records;
}

export function writeCodexTraceFile(inputPath: string, outputPath: string): number {
  const content = readFileSync(inputPath, "utf8");
  const records = parseCodexLogToTraceRecords(content);
  mkdirSync(dirname(outputPath), { recursive: true });
  const jsonl = records.map((record) => JSON.stringify(record)).join("\n");
  writeFileSync(outputPath, jsonl ? `${jsonl}\n` : "", "utf8");
  return records.length;
}
