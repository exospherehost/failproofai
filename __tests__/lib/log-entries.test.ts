import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseLogContent, parseRawLines, parseSessionLog } from "@/lib/log-entries";
import { _resetForTest as resetHookStoreForTest, persistHookActivity } from "@/src/hooks/hook-activity-store";
import type { UserEntry, AssistantEntry, GenericEntry, QueueOperationEntry } from "@/lib/log-entries";

// Helper to create a JSONL line
function line(obj: Record<string, unknown>): string {
  return JSON.stringify(obj);
}

let tempRoot = "";

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), "failproofai-log-entries-"));
});

afterEach(() => {
  delete process.env.CLAUDE_PROJECTS_PATH;
  delete process.env.COPILOT_SESSION_STATE_PATH;
  resetHookStoreForTest();
  if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  tempRoot = "";
});

describe("parseLogContent", () => {
  describe("basic parsing", () => {
    it("parses a single user entry", async () => {
      const content = line({
        type: "user",
        uuid: "u1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: { role: "user", content: "Hello" },
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as UserEntry;
      expect(entry.type).toBe("user");
      expect(entry.uuid).toBe("u1");
      expect(entry.timestampMs).toBe(new Date("2024-06-15T12:00:00.000Z").getTime());
      expect(entry.message.content).toBe("Hello");
    });

    it("parses assistant entry with text block", async () => {
      const content = line({
        type: "assistant",
        uuid: "a1",
        parentUuid: "u1",
        timestamp: "2024-06-15T12:00:01.000Z",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Hi there!" }],
          model: "claude-3-opus",
        },
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as AssistantEntry;
      expect(entry.type).toBe("assistant");
      expect(entry.message.content).toHaveLength(1);
      expect(entry.message.content[0].type).toBe("text");
      if (entry.message.content[0].type === "text") {
        expect(entry.message.content[0].text).toBe("Hi there!");
      }
      expect(entry.message.model).toBe("claude-3-opus");
    });

    it("parses assistant with tool_use block", async () => {
      const content = line({
        type: "assistant",
        uuid: "a1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "tool-1",
              name: "Read",
              input: { file_path: "/test.ts" },
            },
          ],
        },
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as AssistantEntry;
      const block = entry.message.content[0];
      expect(block.type).toBe("tool_use");
      if (block.type === "tool_use") {
        expect(block.id).toBe("tool-1");
        expect(block.name).toBe("Read");
        expect(block.input).toEqual({ file_path: "/test.ts" });
      }
    });

    it("preserves thinking blocks", async () => {
      const content = line({
        type: "assistant",
        uuid: "a1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: {
          role: "assistant",
          content: [
            { type: "thinking", thinking: "Let me think..." },
            { type: "text", text: "Done" },
          ],
        },
      });
      const entries = await parseLogContent(content);
      const entry = entries[0] as AssistantEntry;
      expect(entry.message.content).toHaveLength(2);
      expect(entry.message.content[0].type).toBe("thinking");
    });

    it("filters out unknown block types in assistant content", async () => {
      const content = line({
        type: "assistant",
        uuid: "a1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "hello" },
            { type: "unknown_type", data: "foo" },
          ],
        },
      });
      const entries = await parseLogContent(content);
      const entry = entries[0] as AssistantEntry;
      expect(entry.message.content).toHaveLength(1);
      expect(entry.message.content[0].type).toBe("text");
    });
  });

  describe("tool result enrichment", () => {
    it("enriches tool_use blocks with matching result", async () => {
      const content = [
        line({
          type: "assistant",
          uuid: "a1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: {
            role: "assistant",
            content: [
              { type: "tool_use", id: "tool-1", name: "Read", input: {} },
            ],
          },
        }),
        line({
          type: "user",
          uuid: "u1",
          parentUuid: "a1",
          timestamp: "2024-06-15T12:00:02.000Z",
          message: {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: "tool-1",
                content: "file contents here",
              },
            ],
          },
        }),
      ].join("\n");

      const entries = await parseLogContent(content);
      // Tool result user entry should be excluded from output
      expect(entries).toHaveLength(1);
      const entry = entries[0] as AssistantEntry;
      const block = entry.message.content[0];
      expect(block.type).toBe("tool_use");
      if (block.type === "tool_use") {
        expect(block.result).toBeDefined();
        expect(block.result!.content).toBe("file contents here");
        expect(block.result!.durationMs).toBe(2000);
        expect(block.result!.durationFormatted).toBe("2.0s");
      }
    });

    it("calculates duration = result.timestampMs - assistant.timestampMs", async () => {
      const content = [
        line({
          type: "assistant",
          uuid: "a1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: {
            role: "assistant",
            content: [
              { type: "tool_use", id: "tool-1", name: "Bash", input: {} },
            ],
          },
        }),
        line({
          type: "user",
          uuid: "u1",
          parentUuid: "a1",
          timestamp: "2024-06-15T12:00:05.500Z",
          message: {
            role: "user",
            content: [
              { type: "tool_result", tool_use_id: "tool-1", content: "ok" },
            ],
          },
        }),
      ].join("\n");

      const entries = await parseLogContent(content);
      const entry = entries[0] as AssistantEntry;
      if (entry.message.content[0].type === "tool_use") {
        expect(entry.message.content[0].result!.durationMs).toBe(5500);
      }
    });

    it("tool result user entries are excluded from output array", async () => {
      const content = [
        line({
          type: "assistant",
          uuid: "a1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: {
            role: "assistant",
            content: [
              { type: "tool_use", id: "tool-1", name: "Read", input: {} },
            ],
          },
        }),
        line({
          type: "user",
          uuid: "u1",
          parentUuid: "a1",
          timestamp: "2024-06-15T12:00:01.000Z",
          message: {
            role: "user",
            content: [
              { type: "tool_result", tool_use_id: "tool-1", content: "data" },
            ],
          },
        }),
        line({
          type: "user",
          uuid: "u2",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:02.000Z",
          message: { role: "user", content: "regular message" },
        }),
      ].join("\n");

      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(2); // assistant + regular user, not tool result
      expect(entries.some((e) => e.type === "user")).toBe(true);
      expect(entries.some((e) => e.type === "assistant")).toBe(true);
    });

    it("extracts subagentId from toolUseResult.agentId", async () => {
      const content = [
        line({
          type: "assistant",
          uuid: "a1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: {
            role: "assistant",
            content: [
              { type: "tool_use", id: "tool-1", name: "Task", input: { subagent_type: "Bash", description: "run cmd" } },
            ],
          },
        }),
        line({
          type: "user",
          uuid: "u1",
          parentUuid: "a1",
          timestamp: "2024-06-15T12:00:03.000Z",
          toolUseResult: { agentId: "abc123" },
          message: {
            role: "user",
            content: [
              { type: "tool_result", tool_use_id: "tool-1", content: "done" },
            ],
          },
        }),
      ].join("\n");

      const entries = await parseLogContent(content);
      const entry = entries[0] as AssistantEntry;
      if (entry.message.content[0].type === "tool_use") {
        expect(entry.message.content[0].subagentId).toBe("abc123");
      }
    });
  });

  describe("subagent handling", () => {
    it("Task tool_use gets subagentType and subagentDescription from input", async () => {
      const content = line({
        type: "assistant",
        uuid: "a1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "tool-1",
              name: "Task",
              input: {
                subagent_type: "Explore",
                description: "Find files",
              },
            },
          ],
        },
      });
      const entries = await parseLogContent(content);
      const entry = entries[0] as AssistantEntry;
      if (entry.message.content[0].type === "tool_use") {
        expect(entry.message.content[0].subagentType).toBe("Explore");
        expect(entry.message.content[0].subagentDescription).toBe("Find files");
      }
    });

    it("non-Task tools do NOT get subagent fields", async () => {
      const content = line({
        type: "assistant",
        uuid: "a1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "tool-1",
              name: "Read",
              input: { file_path: "/test.ts" },
            },
          ],
        },
      });
      const entries = await parseLogContent(content);
      const entry = entries[0] as AssistantEntry;
      if (entry.message.content[0].type === "tool_use") {
        expect(entry.message.content[0].subagentType).toBeUndefined();
        expect(entry.message.content[0].subagentDescription).toBeUndefined();
      }
    });
  });

  describe("queue operations", () => {
    it('first queue-operation gets label "Session Started"', async () => {
      const content = line({
        type: "queue-operation",
        uuid: "q1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as QueueOperationEntry;
      expect(entry.type).toBe("queue-operation");
      expect(entry.label).toBe("Session Started");
    });

    it('subsequent queue-operations get label "Session Resumed"', async () => {
      const content = [
        line({
          type: "queue-operation",
          uuid: "q1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
        }),
        line({
          type: "queue-operation",
          uuid: "q2",
          parentUuid: null,
          timestamp: "2024-06-15T12:01:00.000Z",
        }),
        line({
          type: "queue-operation",
          uuid: "q3",
          parentUuid: null,
          timestamp: "2024-06-15T12:02:00.000Z",
        }),
      ].join("\n");
      const entries = await parseLogContent(content);
      const queueEntries = entries.filter(
        (e) => e.type === "queue-operation"
      ) as QueueOperationEntry[];
      expect(queueEntries[0].label).toBe("Session Started");
      expect(queueEntries[1].label).toBe("Session Resumed");
      expect(queueEntries[2].label).toBe("Session Resumed");
    });
  });

  describe("generic entries", () => {
    it("parses file-history-snapshot with raw data", async () => {
      const content = line({
        type: "file-history-snapshot",
        uuid: "f1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        data: { files: ["/a.ts"] },
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as GenericEntry;
      expect(entry.type).toBe("file-history-snapshot");
      expect(entry.raw).toBeDefined();
    });

    it("parses progress entries", async () => {
      const content = line({
        type: "progress",
        uuid: "p1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        progress: 50,
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      expect(entries[0].type).toBe("progress");
    });

    it("parses system entries", async () => {
      const content = line({
        type: "system",
        uuid: "s1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        info: "startup",
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      expect(entries[0].type).toBe("system");
    });
  });

  describe("edge cases", () => {
    it("empty string returns empty array", async () => {
      expect(await parseLogContent("")).toEqual([]);
    });

    it("blank lines are skipped", async () => {
      const content =
        "\n\n" +
        line({
          type: "user",
          uuid: "u1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: { role: "user", content: "hi" },
        }) +
        "\n\n";
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
    });

    it("malformed JSON lines are skipped", async () => {
      const content = [
        "not valid json",
        line({
          type: "user",
          uuid: "u1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: { role: "user", content: "hi" },
        }),
        "{broken",
      ].join("\n");
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
    });

    it("missing timestamp → entry skipped", async () => {
      const content = line({
        type: "user",
        uuid: "u1",
        message: { role: "user", content: "hi" },
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(0);
    });

    it("assistant with empty content → entry skipped", async () => {
      const content = line({
        type: "assistant",
        uuid: "a1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: { role: "assistant", content: [] },
      });
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(0);
    });

    it("output is sorted by timestampMs ascending", async () => {
      const content = [
        line({
          type: "user",
          uuid: "u2",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:02.000Z",
          message: { role: "user", content: "second" },
        }),
        line({
          type: "user",
          uuid: "u1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: { role: "user", content: "first" },
        }),
        line({
          type: "user",
          uuid: "u3",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:01.000Z",
          message: { role: "user", content: "middle" },
        }),
      ].join("\n");
      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(3);
      expect(entries[0].timestampMs).toBeLessThan(entries[1].timestampMs);
      expect(entries[1].timestampMs).toBeLessThan(entries[2].timestampMs);
    });
  });

  describe("_source tagging", () => {
    it("defaults _source to 'session' when no source param", async () => {
      const content = line({
        type: "user",
        uuid: "u1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: { role: "user", content: "Hello" },
      });
      const entries = await parseLogContent(content);
      expect(entries[0]._source).toBe("session");
    });

    it("tags entries with explicit source param", async () => {
      const content = line({
        type: "user",
        uuid: "u1",
        parentUuid: null,
        timestamp: "2024-06-15T12:00:00.000Z",
        message: { role: "user", content: "Hello" },
      });
      const entries = await parseLogContent(content, "agent-abc123");
      expect(entries[0]._source).toBe("agent-abc123");
    });

    it("tags all entry types with _source", async () => {
      const content = [
        line({
          type: "queue-operation",
          uuid: "q1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
        }),
        line({
          type: "user",
          uuid: "u1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:01.000Z",
          message: { role: "user", content: "hi" },
        }),
        line({
          type: "assistant",
          uuid: "a1",
          parentUuid: "u1",
          timestamp: "2024-06-15T12:00:02.000Z",
          message: {
            role: "assistant",
            content: [{ type: "text", text: "hey" }],
          },
        }),
        line({
          type: "system",
          uuid: "s1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:03.000Z",
          info: "startup",
        }),
      ].join("\n");
      const entries = await parseLogContent(content, "agent-xyz");
      for (const entry of entries) {
        expect(entry._source).toBe("agent-xyz");
      }
    });
  });

  describe("Copilot dashboard visibility", () => {
    it("maps Copilot user prompt activity entries into user-visible log lines", async () => {
      const content = line({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "UserPromptSubmit",
        sessionId: "copilot-session-1",
        integration: "copilot",
        toolInput: { prompt: "Explain this repo" },
      });

      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as UserEntry;
      expect(entry.type).toBe("user");
      expect(entry.message.content).toBe("Explain this repo");
    });

    it("maps Copilot lifecycle activity entries into assistant text for the session view", async () => {
      const content = line({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "SessionStart",
        sessionId: "copilot-session-2",
        integration: "copilot",
      });

      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as AssistantEntry;
      expect(entry.type).toBe("assistant");
      expect(entry.message.content[0].type).toBe("text");
      if (entry.message.content[0].type === "text") {
        expect(entry.message.content[0].text).toContain("copilot");
      }
    });

    it("loads Copilot session logs from the session-state UUID folder", async () => {
      const sessionId = "11111111-2222-3333-4444-555555555555";
      const claudeRoot = join(tempRoot, ".claude", "projects");
      const copilotRoot = join(tempRoot, ".copilot", "session-state");
      const sessionDir = join(copilotRoot, sessionId);

      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, "events.jsonl"),
        [
          line({
            type: "user",
            uuid: "u1",
            parentUuid: null,
            timestamp: "2024-06-15T12:00:00.000Z",
            message: { role: "user", content: "hello from copilot" },
          }),
          line({
            type: "assistant",
            uuid: "a1",
            parentUuid: "u1",
            timestamp: "2024-06-15T12:00:01.000Z",
            message: {
              role: "assistant",
              content: [{ type: "text", text: "copilot reply" }],
            },
          }),
        ].join("\n"),
        "utf8",
      );

      process.env.CLAUDE_PROJECTS_PATH = claudeRoot;
      process.env.COPILOT_SESSION_STATE_PATH = copilotRoot;

      const result = await parseSessionLog(sessionId, sessionId);

      expect(result.entries).toHaveLength(2);
      expect(result.sourceMode).toBe("native");
      expect(result.entries[0].type).toBe("user");
      expect(result.entries[1].type).toBe("assistant");
    });

    it("serializes structured toolOutput from activity entries for dashboard rendering", async () => {
      const content = line({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "PostToolUse",
        sessionId: "cursor-session-structured-output",
        integration: "cursor",
        toolName: "Read",
        toolInput: { file_path: "/tmp/a.txt" },
        toolOutput: { lines: ["a", "b"], count: 2 },
      });

      const entries = await parseLogContent(content);
      expect(entries).toHaveLength(1);
      const entry = entries[0] as AssistantEntry;
      expect(entry.type).toBe("assistant");
      expect(entry.message.content[0].type).toBe("tool_use");
      if (entry.message.content[0].type === "tool_use") {
        expect(entry.message.content[0].result?.content).toContain("\"count\": 2");
      }
    });

    it("falls back to activity-store entries when native transcript is unavailable", async () => {
      const hookStoreDir = join(tempRoot, ".failproofai", "cache", "hook-activity");
      resetHookStoreForTest(hookStoreDir);
      process.env.CLAUDE_PROJECTS_PATH = join(tempRoot, ".claude", "projects");
      mkdirSync(process.env.CLAUDE_PROJECTS_PATH, { recursive: true });

      persistHookActivity({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "UserPromptSubmit",
        toolName: null,
        policyName: null,
        decision: "allow",
        reason: null,
        durationMs: 1,
        sessionId: "cursor-s1",
        integration: "cursor",
        cwd: "/tmp/workspace",
        toolInput: { prompt: "Hello from fallback" },
      });

      const result = await parseSessionLog("-tmp-workspace", "cursor-s1");
      expect(result.sourceMode).toBe("fallback");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("user");
    });

    it("prefers transcriptPath native source over mirrored .claude session file for virtual integrations", async () => {
      const hookStoreDir = join(tempRoot, ".failproofai", "cache", "hook-activity");
      resetHookStoreForTest(hookStoreDir);
      const claudeRoot = join(tempRoot, ".claude", "projects");
      process.env.CLAUDE_PROJECTS_PATH = claudeRoot;
      const projectName = "-tmp-workspace";
      const projectDir = join(claudeRoot, projectName);
      mkdirSync(projectDir, { recursive: true });

      // Mirrored file exists but is incomplete.
      writeFileSync(
        join(projectDir, "cursor-s4.jsonl"),
        line({
          type: "assistant",
          uuid: "a-mirror",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: { role: "assistant", content: [{ type: "text", text: "mirror content" }] },
        }),
        "utf8",
      );

      const nativeTranscriptPath = join(tempRoot, "cursor-native.json");
      writeFileSync(
        nativeTranscriptPath,
        JSON.stringify([
          { role: "user", timestamp: "2024-06-15T12:00:01.000Z", content: "from native transcript" },
        ]),
        "utf8",
      );

      persistHookActivity({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "SessionStart",
        toolName: null,
        policyName: null,
        decision: "allow",
        reason: null,
        durationMs: 1,
        sessionId: "cursor-s4",
        integration: "cursor",
        cwd: "/tmp/workspace",
        transcriptPath: nativeTranscriptPath,
      });

      const result = await parseSessionLog(projectName, "cursor-s4");
      expect(result.sourceMode).toBe("native");
      expect(result.sourceDetail).toBe(nativeTranscriptPath);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("user");
    });

    it("falls back to activity-store when transcriptPath exists but native parse fails", async () => {
      const hookStoreDir = join(tempRoot, ".failproofai", "cache", "hook-activity");
      resetHookStoreForTest(hookStoreDir);
      process.env.CLAUDE_PROJECTS_PATH = join(tempRoot, ".claude", "projects");
      mkdirSync(process.env.CLAUDE_PROJECTS_PATH, { recursive: true });

      const badTranscriptPath = join(tempRoot, "bad-transcript.json");
      writeFileSync(badTranscriptPath, "{not valid json", "utf8");

      persistHookActivity({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "UserPromptSubmit",
        toolName: null,
        policyName: null,
        decision: "allow",
        reason: null,
        durationMs: 1,
        sessionId: "cursor-s2",
        integration: "cursor",
        cwd: "/tmp/workspace",
        transcriptPath: badTranscriptPath,
        toolInput: { prompt: "Fallback after parse fail" },
      });

      const result = await parseSessionLog("-tmp-workspace", "cursor-s2");
      expect(result.sourceMode).toBe("fallback");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("user");
    });

    it("parses native JSON transcript arrays and ignores malformed role/timestamp records", async () => {
      const hookStoreDir = join(tempRoot, ".failproofai", "cache", "hook-activity");
      resetHookStoreForTest(hookStoreDir);
      process.env.CLAUDE_PROJECTS_PATH = join(tempRoot, ".claude", "projects");
      mkdirSync(process.env.CLAUDE_PROJECTS_PATH, { recursive: true });

      const jsonTranscriptPath = join(tempRoot, "native-transcript.json");
      writeFileSync(
        jsonTranscriptPath,
        JSON.stringify([
          { role: "user", timestamp: "1718452800000", content: "hello" },
          { role: "assistant", timestamp: "2024-06-15T12:00:01.000Z", content: { ok: true } },
          { role: "system", timestamp: "2024-06-15T12:00:02.000Z", content: "ignore me" },
          { role: "assistant", content: "missing timestamp ignored" },
        ]),
        "utf8",
      );

      persistHookActivity({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "SessionStart",
        toolName: null,
        policyName: null,
        decision: "allow",
        reason: null,
        durationMs: 1,
        sessionId: "cursor-s3",
        integration: "cursor",
        cwd: "/tmp/workspace",
        transcriptPath: jsonTranscriptPath,
      });

      const result = await parseSessionLog("-tmp-workspace", "cursor-s3");
      expect(result.sourceMode).toBe("native");
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].type).toBe("user");
      expect(result.entries[1].type).toBe("assistant");
      if (result.entries[1].type === "assistant") {
        expect(result.entries[1].message.content[0].type).toBe("text");
      }
    });

    it("uses known Cursor transcript location when transcriptPath metadata is missing", async () => {
      const hookStoreDir = join(tempRoot, ".failproofai", "cache", "hook-activity");
      resetHookStoreForTest(hookStoreDir);
      const homeDir = join(tempRoot, "home");
      process.env.HOME = homeDir;
      process.env.CLAUDE_PROJECTS_PATH = join(tempRoot, ".claude", "projects");

      const projectName = "-tmp-workspace";
      const sessionId = "cursor-s5";
      const cursorTranscriptDir = join(
        homeDir,
        ".cursor",
        "projects",
        "tmp-workspace",
        "agent-transcripts",
        sessionId,
      );
      mkdirSync(cursorTranscriptDir, { recursive: true });
      writeFileSync(
        join(cursorTranscriptDir, `${sessionId}.jsonl`),
        line({
          type: "user",
          uuid: "u-native",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: { role: "user", content: "cursor native transcript" },
        }),
        "utf8",
      );

      persistHookActivity({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "SessionStart",
        toolName: null,
        policyName: null,
        decision: "allow",
        reason: null,
        durationMs: 1,
        sessionId,
        integration: "cursor",
        cwd: "/tmp/workspace",
      });

      const result = await parseSessionLog(projectName, sessionId);
      expect(result.sourceMode).toBe("native");
      expect(result.sourceDetail).toContain(`/${sessionId}.jsonl`);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("user");
    });

    it("prefers mirrored JSONL with tool pairing over activity-store fallback for virtual integrations", async () => {
      const hookStoreDir = join(tempRoot, ".failproofai", "cache", "hook-activity");
      resetHookStoreForTest(hookStoreDir);
      process.env.CLAUDE_PROJECTS_PATH = join(tempRoot, ".claude", "projects");

      const projectName = "-tmp-workspace";
      const sessionId = "cursor-with-tool";
      const projectDir = join(process.env.CLAUDE_PROJECTS_PATH, projectName);
      mkdirSync(projectDir, { recursive: true });

      // Write mirrored JSONL with proper tool pre/post pairing (as writeVirtualLogEntry does)
      const mirroredJsonl = [
        line({
          type: "assistant",
          uuid: "tool-1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: {
            role: "assistant",
            content: [
              {
                type: "tool_use",
                id: "toolu_virt_123",
                name: "Read",
                input: { file_path: "/test.txt" },
              },
            ],
          },
        }),
        line({
          type: "user",
          uuid: "result-1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:01.000Z",
          message: {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: "toolu_virt_123",
                content: "file contents",
              },
            ],
          },
        }),
      ].join("\n");

      writeFileSync(join(projectDir, `${sessionId}.jsonl`), mirroredJsonl, "utf8");

      // Also add a matching activity entry (without transcriptPath to trigger fallback path)
      persistHookActivity({
        timestamp: Date.parse("2024-06-15T12:00:00.000Z"),
        eventType: "PreToolUse",
        toolName: "Read",
        toolInput: { file_path: "/test.txt" },
        policyName: null,
        decision: "allow",
        reason: null,
        durationMs: 10,
        sessionId,
        integration: "cursor",
        cwd: "/tmp/workspace",
      });

      const result = await parseSessionLog(projectName, sessionId);

      // Should use mirrored JSONL (native source), not activity-store fallback
      expect(result.sourceMode).toBe("native");
      expect(result.entries).toHaveLength(1);

      // First entry: assistant with tool_use
      const toolEntry = result.entries[0];
      expect(toolEntry.type).toBe("assistant");
      if (toolEntry.type === "assistant" && toolEntry.message.content[0]?.type === "tool_use") {
        const toolBlock = toolEntry.message.content[0];
        expect(toolBlock.name).toBe("Read");
        // The key assertion: result should be populated (not undefined)
        expect(toolBlock.result).toBeDefined();
        expect(toolBlock.result?.content).toContain("file contents");
      }
    });

    it("deduplicates mirrored and activity lifecycle rows with slight timestamp drift", async () => {
      const hookStoreDir = join(tempRoot, ".failproofai", "cache", "hook-activity");
      resetHookStoreForTest(hookStoreDir);
      process.env.CLAUDE_PROJECTS_PATH = join(tempRoot, ".claude", "projects");

      const projectName = "-tmp-workspace";
      const sessionId = "copilot-lifecycle-dedupe";
      const projectDir = join(process.env.CLAUDE_PROJECTS_PATH, projectName);
      mkdirSync(projectDir, { recursive: true });

      writeFileSync(
        join(projectDir, `${sessionId}.jsonl`),
        line({
          type: "assistant",
          uuid: "a-life-1",
          parentUuid: null,
          timestamp: "2024-06-15T12:00:00.000Z",
          message: {
            role: "assistant",
            content: [{ type: "text", text: "Session started via copilot" }],
          },
        }),
        "utf8",
      );

      persistHookActivity({
        timestamp: Date.parse("2024-06-15T12:00:01.000Z"), // within dedupe bucket tolerance
        eventType: "sessionStart",
        toolName: null,
        policyName: null,
        decision: "allow",
        reason: null,
        durationMs: 1,
        sessionId,
        integration: "copilot",
        cwd: "/tmp/workspace",
      });

      const result = await parseSessionLog(projectName, sessionId);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].type).toBe("assistant");
    });
  });
});

describe("parseRawLines", () => {
  it("injects _source when source param provided", () => {
    const content = [
      line({ type: "user", timestamp: "2024-06-15T12:00:00.000Z" }),
      line({ type: "assistant", timestamp: "2024-06-15T12:00:01.000Z" }),
    ].join("\n");
    const rawLines = parseRawLines(content, "agent-abc");
    expect(rawLines).toHaveLength(2);
    expect(rawLines[0]._source).toBe("agent-abc");
    expect(rawLines[1]._source).toBe("agent-abc");
  });

  it("does not inject _source when source param omitted", () => {
    const content = line({ type: "user", timestamp: "2024-06-15T12:00:00.000Z" });
    const rawLines = parseRawLines(content);
    expect(rawLines[0]._source).toBeUndefined();
  });
});
