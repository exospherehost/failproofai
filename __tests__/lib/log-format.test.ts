import { describe, it, expect } from "vitest";
import { formatInput, formatRaw, formatLocalTimestamp, getEntryTextContent } from "@/lib/log-format";
import type { ToolUseBlock, GenericEntry, UserEntry, AssistantEntry, QueueOperationEntry } from "@/lib/log-entries";

describe("formatInput", () => {
  it("pretty-prints tool use block input as JSON", () => {
    const block: ToolUseBlock = {
      type: "tool_use",
      id: "tool-1",
      name: "Read",
      input: { file_path: "/test.ts", limit: 100 },
    };
    const result = formatInput(block);
    expect(result).toBe(JSON.stringify({ file_path: "/test.ts", limit: 100 }, null, 2));
  });
});

describe("formatRaw", () => {
  it("pretty-prints generic entry raw data as JSON", () => {
    const entry: GenericEntry = {
      type: "progress",
      _source: "session",
      uuid: "u1",
      parentUuid: null,
      timestamp: "2024-01-01T00:00:00Z",
      timestampMs: 0,
      timestampFormatted: "",
      raw: { type: "progress", data: "loading" },
    };
    const result = formatRaw(entry);
    expect(result).toBe(JSON.stringify({ type: "progress", data: "loading" }, null, 2));
  });
});

describe("formatLocalTimestamp", () => {
  it("includes milliseconds with 3-digit padding", () => {
    // Epoch 5ms → should produce ".005"
    const result = formatLocalTimestamp(5);
    expect(result).toMatch(/\.005$/);
  });

  it("handles epoch 0", () => {
    const result = formatLocalTimestamp(0);
    expect(result).toMatch(/\.000$/);
    // Should produce a non-empty formatted date string
    expect(result.length).toBeGreaterThan(10);
  });

  it("formats a regular timestamp correctly", () => {
    const ts = new Date("2024-06-15T14:30:45.123Z").getTime();
    const result = formatLocalTimestamp(ts);
    expect(result).toMatch(/\.123$/);
    expect(result).toContain("2024");
  });
});

describe("getEntryTextContent", () => {
  const base = {
    _source: "session" as const,
    uuid: "u1",
    parentUuid: null,
    timestamp: "2024-01-01T00:00:00Z",
    timestampMs: 0,
    timestampFormatted: "",
  };

  it("returns user message content", () => {
    const entry: UserEntry = {
      ...base,
      type: "user",
      message: { role: "user", content: "Hello world" },
    };
    expect(getEntryTextContent(entry)).toBe("Hello world");
  });

  it("returns assistant text blocks joined by newlines", () => {
    const entry: AssistantEntry = {
      ...base,
      type: "assistant",
      message: {
        role: "assistant",
        content: [
          { type: "text", text: "Line one" },
          { type: "tool_use", id: "t1", name: "Read", input: {} },
          { type: "text", text: "Line two" },
        ],
      },
    };
    expect(getEntryTextContent(entry)).toBe("Line one\nLine two");
  });

  it("returns raw JSON for generic entries", () => {
    const entry: GenericEntry = {
      ...base,
      type: "progress",
      raw: { type: "progress", step: 3 },
    };
    expect(getEntryTextContent(entry)).toBe(JSON.stringify({ type: "progress", step: 3 }, null, 2));
  });

  it("returns label for queue-operation entries", () => {
    const entry: QueueOperationEntry = {
      ...base,
      type: "queue-operation",
      label: "Session Started",
    };
    expect(getEntryTextContent(entry)).toBe("Session Started");
  });
});
