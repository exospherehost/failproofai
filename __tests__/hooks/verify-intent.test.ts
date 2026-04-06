// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
}));

vi.mock("../../src/hooks/llm-client", () => ({
  chatCompletion: vi.fn(),
}));

vi.mock("../../src/hooks/hook-logger", () => ({
  hookLogInfo: vi.fn(),
  hookLogWarn: vi.fn(),
  hookLogError: vi.fn(),
}));

import { readFile } from "node:fs/promises";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { chatCompletion } from "../../src/hooks/llm-client";
import { verifyIntent } from "../../src/hooks/verify-intent";
import type { PolicyContext, PolicyResult } from "../../src/hooks/policy-types";

function makeStopCtx(overrides: Partial<PolicyContext> = {}): PolicyContext {
  return {
    eventType: "Stop",
    payload: {},
    session: {
      sessionId: "test-session-123",
      transcriptPath: "/tmp/transcript.jsonl",
    },
    ...overrides,
  };
}

function makeTranscript(
  entries: Array<{ type: string; role?: string; content: string }>,
): string {
  return entries
    .map((e) =>
      JSON.stringify({
        type: e.type,
        message: { role: e.role ?? e.type, content: e.content },
      }),
    )
    .join("\n");
}

describe("hooks/verify-intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(existsSync).mockReturnValue(false);
  });

  describe("event type guard", () => {
    it("returns allow for non-Stop events", async () => {
      const ctx = makeStopCtx({ eventType: "PreToolUse" });
      const result = await verifyIntent(ctx);
      expect(result.decision).toBe("allow");
    });
  });

  describe("graceful failure cases", () => {
    it("returns allow when sessionId is missing", async () => {
      const ctx = makeStopCtx({ session: { transcriptPath: "/tmp/t.jsonl" } });
      const result = await verifyIntent(ctx);
      expect(result.decision).toBe("allow");
    });

    it("returns allow when transcriptPath is missing", async () => {
      const ctx = makeStopCtx({ session: { sessionId: "abc" } });
      const result = await verifyIntent(ctx);
      expect(result.decision).toBe("allow");
    });

    it("returns allow when transcript file cannot be read", async () => {
      vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
    });

    it("returns allow when transcript has no user messages", async () => {
      const transcript = makeTranscript([
        { type: "assistant", role: "assistant", content: "Hello!" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
    });

    it("returns allow when LLM call fails (no API key)", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the bug" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion).mockRejectedValue(
        new Error("No LLM API key configured"),
      );
      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
    });

    it("returns allow when Pass 1 returns malformed JSON", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the bug" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion).mockResolvedValue({
        content: "not valid json",
      });
      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
    });

    it("returns allow when Pass 1 extracts zero intents", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Thanks!" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ intents: [] }),
      });
      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
    });

    it("returns allow when Pass 2 LLM call fails", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the bug" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [{ id: 1, description: "Fix the bug", source: "Fix the bug" }],
          }),
        })
        .mockRejectedValueOnce(new Error("API error"));
      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
    });
  });

  describe("transcript parsing", () => {
    it("extracts user messages from human-type entries", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the login bug" },
        { type: "assistant", role: "assistant", content: "Working on it..." },
        { type: "human", role: "user", content: "Also add tests" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ intents: [] }),
      });

      await verifyIntent(makeStopCtx());

      // Check that chatCompletion was called with user messages
      const call = vi.mocked(chatCompletion).mock.calls[0];
      const userContent = call[0][1].content;
      expect(userContent).toContain("Fix the login bug");
      expect(userContent).toContain("Also add tests");
    });

    it("handles array content blocks in messages", async () => {
      const transcript = JSON.stringify({
        type: "human",
        message: {
          role: "user",
          content: [
            { type: "text", text: "Fix this" },
            { type: "image", data: "..." },
            { type: "text", text: "please" },
          ],
        },
      });
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ intents: [] }),
      });

      await verifyIntent(makeStopCtx());

      const call = vi.mocked(chatCompletion).mock.calls[0];
      const userContent = call[0][1].content;
      expect(userContent).toContain("Fix this");
      expect(userContent).toContain("please");
    });

    it("skips malformed JSONL lines", async () => {
      const transcript =
        '{"type":"human","message":{"role":"user","content":"Fix bug"}}\n' +
        "not json\n" +
        '{"type":"human","message":{"role":"user","content":"Add tests"}}';
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ intents: [] }),
      });

      await verifyIntent(makeStopCtx());

      const call = vi.mocked(chatCompletion).mock.calls[0];
      const userContent = call[0][1].content;
      expect(userContent).toContain("Fix bug");
      expect(userContent).toContain("Add tests");
    });
  });

  describe("Pass 1: intent extraction", () => {
    it("sends user messages to LLM with system prompt", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the login bug" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion).mockResolvedValue({
        content: JSON.stringify({ intents: [] }),
      });

      await verifyIntent(makeStopCtx());

      const call = vi.mocked(chatCompletion).mock.calls[0];
      expect(call[0][0].role).toBe("system");
      expect(call[0][0].content).toContain("Extract all distinct requests");
      expect(call[1]).toEqual({ responseFormat: { type: "json_object" } });
    });
  });

  describe("Pass 2: intent verification", () => {
    it("sends intents and transcript to LLM", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the login bug" },
        { type: "assistant", role: "assistant", content: "Fixed the login flow." },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [{ id: 1, description: "Fix the login bug", source: "Fix the login bug" }],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            results: [{ id: 1, status: "satisfied", evidence: "Login flow fixed" }],
          }),
        });

      await verifyIntent(makeStopCtx());

      // Pass 2 call
      const call = vi.mocked(chatCompletion).mock.calls[1];
      expect(call[0][0].role).toBe("system");
      expect(call[0][0].content).toContain("verifying whether an AI coding assistant");
      expect(call[0][1].content).toContain("Fix the login bug");
      expect(call[1]).toEqual({ responseFormat: { type: "json_object" } });
    });
  });

  describe("decision logic", () => {
    it("returns allow when all intents are satisfied", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the login bug" },
        { type: "assistant", role: "assistant", content: "Done." },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [{ id: 1, description: "Fix the login bug", source: "Fix the login bug" }],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            results: [{ id: 1, status: "satisfied", evidence: "Bug fixed" }],
          }),
        });

      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
    });

    it("returns instruct when some intents are unsatisfied", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix the login bug" },
        { type: "human", role: "user", content: "Add a logout button" },
        { type: "assistant", role: "assistant", content: "Fixed login." },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [
              { id: 1, description: "Fix the login bug", source: "Fix the login bug" },
              { id: 2, description: "Add a logout button", source: "Add a logout button" },
            ],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            results: [
              { id: 1, status: "satisfied", evidence: "Login fixed" },
              { id: 2, status: "unsatisfied", evidence: "No logout button added" },
            ],
          }),
        });

      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("instruct");
      expect(result.reason).toContain("Add a logout button");
      expect(result.reason).toContain("No logout button added");
      expect(result.reason).toContain("Attempt 1/3");
    });

    it("instruct message lists all unsatisfied intents", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Do task A" },
        { type: "human", role: "user", content: "Do task B" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [
              { id: 1, description: "Task A", source: "Do task A" },
              { id: 2, description: "Task B", source: "Do task B" },
            ],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            results: [
              { id: 1, status: "unsatisfied", evidence: "Not done" },
              { id: 2, status: "unsatisfied", evidence: "Not started" },
            ],
          }),
        });

      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("instruct");
      expect(result.reason).toContain("Task A");
      expect(result.reason).toContain("Task B");
      expect(result.reason).toContain("Not done");
      expect(result.reason).toContain("Not started");
    });
  });

  describe("retry state", () => {
    it("creates retry state file on first Stop", async () => {
      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix bug" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [{ id: 1, description: "Fix bug", source: "Fix bug" }],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            results: [{ id: 1, status: "unsatisfied", evidence: "Not fixed" }],
          }),
        });

      await verifyIntent(makeStopCtx());

      expect(writeFileSync).toHaveBeenCalled();
      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.retryCount).toBe(1);
      expect(written.sessionId).toBe("test-session-123");
    });

    it("increments retryCount on subsequent Stops", async () => {
      // Simulate existing retry state
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          sessionId: "test-session-123",
          retryCount: 1,
          lastCheckedAt: Date.now(),
          unsatisfiedIntents: [],
        }),
      );

      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix bug" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [{ id: 1, description: "Fix bug", source: "Fix bug" }],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            results: [{ id: 1, status: "unsatisfied", evidence: "Still not fixed" }],
          }),
        });

      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("instruct");
      expect(result.reason).toContain("Attempt 2/3");

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.retryCount).toBe(2);
    });

    it("returns allow when retryCount >= 3", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          sessionId: "test-session-123",
          retryCount: 3,
          lastCheckedAt: Date.now(),
          unsatisfiedIntents: [],
        }),
      );

      const result = await verifyIntent(makeStopCtx());
      expect(result.decision).toBe("allow");
      // Should not call LLM at all
      expect(chatCompletion).not.toHaveBeenCalled();
    });

    it("creates cache directory if it does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const transcript = makeTranscript([
        { type: "human", role: "user", content: "Fix bug" },
      ]);
      vi.mocked(readFile).mockResolvedValue(transcript);
      vi.mocked(chatCompletion)
        .mockResolvedValueOnce({
          content: JSON.stringify({
            intents: [{ id: 1, description: "Fix bug", source: "Fix bug" }],
          }),
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            results: [{ id: 1, status: "unsatisfied", evidence: "Not fixed" }],
          }),
        });

      await verifyIntent(makeStopCtx());

      expect(mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining("verify-intent"),
        { recursive: true },
      );
    });
  });
});
