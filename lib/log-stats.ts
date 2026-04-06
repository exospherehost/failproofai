import type { LogEntry } from "./log-entries";
import { formatDuration } from "./format-duration";

export interface LogStats {
  turnCount: number;
  userCount: number;
  assistantCount: number;
  toolCallCount: number;
  subagentCount: number;
  duration: string;
  models: string[];
}

/**
 * Computes summary statistics from parsed log entries.
 *
 * Iterates entries once, counting users, assistants, tool calls, and
 * subagent spawns. Duration is derived from the timestamp delta between
 * the first and last entry. Models are de-duplicated into a set.
 */
export function calculateLogStats(entries: LogEntry[]): LogStats {
  let userCount = 0;
  let assistantCount = 0;
  let toolCallCount = 0;
  let subagentCount = 0;
  let turnCount = 0;
  const models = new Set<string>();

  for (const entry of entries) {
    if (entry.type === "user") userCount++;
    if (entry.type === "queue-operation") turnCount++;
    if (entry.type === "assistant") {
      assistantCount++;
      for (const block of entry.message.content) {
        if (block.type === "tool_use") {
          if (block.name === "Task" && (block.subagentType || block.subagentId)) {
            subagentCount++;
          } else {
            toolCallCount++;
          }
        }
      }
      if (entry.message.model) models.add(entry.message.model);
    }
  }

  let duration = "";
  if (entries.length >= 2) {
    const diffMs = entries[entries.length - 1].timestampMs - entries[0].timestampMs;
    duration = formatDuration(diffMs);
  }

  return { turnCount, userCount, assistantCount, toolCallCount, subagentCount, duration, models: Array.from(models) };
}
