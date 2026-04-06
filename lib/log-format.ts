/**
 * Client-safe lazy formatting helpers for log entry display.
 * Separated from log-entries.ts to avoid pulling in Node.js fs modules
 * when imported from "use client" components.
 */
import type { LogEntry, ToolUseBlock, GenericEntry } from "./log-entries";

export function formatInput(block: ToolUseBlock): string {
  return JSON.stringify(block.input, null, 2);
}

export function formatRaw(entry: GenericEntry): string {
  return JSON.stringify(entry.raw, null, 2);
}

/**
 * Extracts a copyable plain-text representation from any log entry type.
 */
export function getEntryTextContent(entry: LogEntry): string {
  switch (entry.type) {
    case "user":
      return entry.message.content;
    case "assistant":
      return entry.message.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    case "file-history-snapshot":
    case "progress":
    case "system":
      return formatRaw(entry);
    case "queue-operation":
      return entry.label;
  }
}

const tsFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

/**
 * Formats a UTC timestamp (ms epoch) to the user's local timezone with
 * millisecond precision.  Runs client-side so the browser's timezone applies.
 */
export function formatLocalTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const base = tsFormatter.format(date);
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${base}.${ms}`;
}
