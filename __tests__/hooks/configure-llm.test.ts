// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
}));

vi.mock("node:readline", () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn(),
    close: vi.fn(),
  })),
}));

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { configureLlm } from "../../src/hooks/configure-llm";

describe("hooks/configure-llm", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("non-interactive mode (flags provided)", () => {
    it("saves all flags directly to config", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await configureLlm({
        apiKey: "sk-test-123",
        baseUrl: "https://api.groq.com/openai/v1",
        model: "llama-3-70b",
      });

      expect(writeFileSync).toHaveBeenCalled();
      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.llm).toEqual({
        apiKey: "sk-test-123",
        baseUrl: "https://api.groq.com/openai/v1",
        model: "llama-3-70b",
      });
    });

    it("uses defaults for baseUrl and model when only apiKey provided", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await configureLlm({ apiKey: "sk-test-456" });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.llm.apiKey).toBe("sk-test-456");
      expect(written.llm.baseUrl).toBe("https://api.openai.com/v1");
      expect(written.llm.model).toBe("gpt-4o-mini");
    });

    it("preserves existing enabledPolicies when saving llm config", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ enabledPolicies: ["block-sudo", "verify-intent"] }),
      );

      await configureLlm({ apiKey: "sk-test-789" });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.enabledPolicies).toEqual(["block-sudo", "verify-intent"]);
      expect(written.llm.apiKey).toBe("sk-test-789");
    });

    it("prints configuration summary", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await configureLlm({ apiKey: "sk-test-123" });

      const output = consoleLogSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
      expect(output).toContain("LLM configuration saved");
      expect(output).toContain("sk-t...-123"); // masked key
    });

    it("uses existing config values when partial flags provided", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          enabledPolicies: [],
          llm: {
            apiKey: "sk-old-key",
            baseUrl: "https://api.old.com/v1",
            model: "old-model",
          },
        }),
      );

      await configureLlm({ apiKey: "sk-new-key" });

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      // apiKey updated, others preserved from existing config
      expect(written.llm.apiKey).toBe("sk-new-key");
      expect(written.llm.baseUrl).toBe("https://api.old.com/v1");
      expect(written.llm.model).toBe("old-model");
    });
  });

  describe("interactive mode", () => {
    it("prompts for all fields when no flags and no existing config", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const mockRl = {
        question: vi.fn(),
        close: vi.fn(),
      };
      // Simulate user input: api key, base url (default), model (default)
      mockRl.question
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb("sk-interactive-key"))
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb(""))  // accept default
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb(""));  // accept default

      vi.mocked(createInterface).mockReturnValue(mockRl as unknown as ReturnType<typeof createInterface>);

      await configureLlm({});

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.llm).toEqual({
        apiKey: "sk-interactive-key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini",
      });
      expect(mockRl.close).toHaveBeenCalled();
    });

    it("uses user-provided values over defaults", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const mockRl = {
        question: vi.fn(),
        close: vi.fn(),
      };
      mockRl.question
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb("sk-custom"))
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb("https://api.groq.com/openai/v1"))
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb("mixtral-8x7b"));

      vi.mocked(createInterface).mockReturnValue(mockRl as unknown as ReturnType<typeof createInterface>);

      await configureLlm({});

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      expect(written.llm).toEqual({
        apiKey: "sk-custom",
        baseUrl: "https://api.groq.com/openai/v1",
        model: "mixtral-8x7b",
      });
    });

    it("shows existing values as defaults in prompts", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({
          enabledPolicies: [],
          llm: {
            apiKey: "sk-existing",
            baseUrl: "https://api.existing.com/v1",
            model: "existing-model",
          },
        }),
      );

      const mockRl = {
        question: vi.fn(),
        close: vi.fn(),
      };
      // Accept all defaults (press enter)
      mockRl.question
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb(""))
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb(""))
        .mockImplementationOnce((_q: string, cb: (a: string) => void) => cb(""));

      vi.mocked(createInterface).mockReturnValue(mockRl as unknown as ReturnType<typeof createInterface>);

      await configureLlm({});

      // Should show existing masked key in prompt
      const apiKeyPrompt = mockRl.question.mock.calls[0][0];
      expect(apiKeyPrompt).toContain("sk-e");

      const written = JSON.parse(
        vi.mocked(writeFileSync).mock.calls[0][1] as string,
      );
      // All existing values preserved
      expect(written.llm.apiKey).toBe("sk-existing");
      expect(written.llm.baseUrl).toBe("https://api.existing.com/v1");
      expect(written.llm.model).toBe("existing-model");
    });
  });
});
