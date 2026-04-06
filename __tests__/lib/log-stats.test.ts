import { describe, it, expect } from "vitest";
import { calculateLogStats } from "@/lib/log-stats";
import type { LogEntry, AssistantEntry, UserEntry, QueueOperationEntry } from "@/lib/log-entries";

function makeUserEntry(ts: number): UserEntry {
  return {
    type: "user",
    _source: "session",
    uuid: `u-${ts}`,
    parentUuid: null,
    timestamp: new Date(ts).toISOString(),
    timestampMs: ts,
    timestampFormatted: "",
    message: { role: "user", content: "hello" },
  };
}

function makeAssistantEntry(
  ts: number,
  blocks: AssistantEntry["message"]["content"] = [{ type: "text", text: "hi" }],
  model?: string
): AssistantEntry {
  return {
    type: "assistant",
    _source: "session",
    uuid: `a-${ts}`,
    parentUuid: null,
    timestamp: new Date(ts).toISOString(),
    timestampMs: ts,
    timestampFormatted: "",
    message: { role: "assistant", content: blocks, model },
  };
}

function makeQueueEntry(ts: number, label: "Session Started" | "Session Resumed"): QueueOperationEntry {
  return {
    type: "queue-operation",
    _source: "session",
    uuid: `q-${ts}`,
    parentUuid: null,
    timestamp: new Date(ts).toISOString(),
    timestampMs: ts,
    timestampFormatted: "",
    label,
  };
}

describe("calculateLogStats", () => {
  it("empty array returns all zeros, empty duration, empty models", () => {
    const stats = calculateLogStats([]);
    expect(stats.turnCount).toBe(0);
    expect(stats.userCount).toBe(0);
    expect(stats.assistantCount).toBe(0);
    expect(stats.toolCallCount).toBe(0);
    expect(stats.subagentCount).toBe(0);
    expect(stats.duration).toBe("");
    expect(stats.models).toEqual([]);
  });

  it("counts user, assistant, queue-operation entries correctly", () => {
    const entries: LogEntry[] = [
      makeQueueEntry(1000, "Session Started"),
      makeUserEntry(2000),
      makeAssistantEntry(3000),
      makeUserEntry(4000),
      makeAssistantEntry(5000),
      makeQueueEntry(6000, "Session Resumed"),
    ];
    const stats = calculateLogStats(entries);
    expect(stats.userCount).toBe(2);
    expect(stats.assistantCount).toBe(2);
    expect(stats.turnCount).toBe(2);
  });

  it("regular tool_use blocks increment toolCallCount", () => {
    const entries: LogEntry[] = [
      makeAssistantEntry(1000, [
        { type: "tool_use", id: "t1", name: "Read", input: {} },
        { type: "tool_use", id: "t2", name: "Bash", input: {} },
      ]),
    ];
    const stats = calculateLogStats(entries);
    expect(stats.toolCallCount).toBe(2);
    expect(stats.subagentCount).toBe(0);
  });

  it("Task tool with subagentType/subagentId increments subagentCount, not toolCallCount", () => {
    const entries: LogEntry[] = [
      makeAssistantEntry(1000, [
        {
          type: "tool_use",
          id: "t1",
          name: "Task",
          input: { subagent_type: "Explore" },
          subagentType: "Explore",
          subagentId: "abc123",
        },
      ]),
    ];
    const stats = calculateLogStats(entries);
    expect(stats.subagentCount).toBe(1);
    expect(stats.toolCallCount).toBe(0);
  });

  it("collects unique model names from assistant entries", () => {
    const entries: LogEntry[] = [
      makeAssistantEntry(1000, [{ type: "text", text: "hi" }], "claude-3-opus"),
      makeAssistantEntry(2000, [{ type: "text", text: "hi" }], "claude-3-sonnet"),
      makeAssistantEntry(3000, [{ type: "text", text: "hi" }], "claude-3-opus"),
    ];
    const stats = calculateLogStats(entries);
    expect(stats.models).toHaveLength(2);
    expect(stats.models).toContain("claude-3-opus");
    expect(stats.models).toContain("claude-3-sonnet");
  });

  it("computes duration from first to last entry timestamp", () => {
    const entries: LogEntry[] = [
      makeUserEntry(0),
      makeAssistantEntry(5000),
    ];
    const stats = calculateLogStats(entries);
    expect(stats.duration).toBe("5.0s");
  });

  it("single entry produces empty duration string", () => {
    const entries: LogEntry[] = [makeUserEntry(1000)];
    const stats = calculateLogStats(entries);
    expect(stats.duration).toBe("");
  });
});
