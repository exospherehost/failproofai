// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseCodexLogToTraceRecords } from "../../src/codex/trace-parser";

describe("codex/trace-parser", () => {
  it("extracts exec_command lines and ignores plugin noise", () => {
    const content = [
      "2026-04-15T12:00:00.000Z WARN codex_core::plugins::manifest ignoring interface.defaultPrompt: prompt must be at most 128 characters",
      '2026-04-15T12:00:01.100Z INFO codex_core::runtime thread_id=thr_abc ToolCall: exec_command {"command":"ls -la"}',
    ].join("\n");

    const records = parseCodexLogToTraceRecords(content);
    expect(records).toEqual([
      {
        timestamp: "2026-04-15T12:00:01.100Z",
        thread_id: "thr_abc",
        tool_call: "exec_command",
        command: "ls -la",
      },
    ]);
  });

  it("extracts custom_tool_call lines with command assignment format", () => {
    const content =
      '2026-04-15T12:00:02.300Z INFO codex_engine thread_id=worker-2 ToolCall: custom_tool_call command="python script.py --check"';

    const records = parseCodexLogToTraceRecords(content);
    expect(records).toEqual([
      {
        timestamp: "2026-04-15T12:00:02.300Z",
        thread_id: "worker-2",
        tool_call: "custom_tool_call",
        command: "python script.py --check",
      },
    ]);
  });

  it("skips malformed ToolCall lines without a command", () => {
    const content =
      "2026-04-15T12:00:03.300Z INFO codex_engine thread_id=worker-3 ToolCall: exec_command";

    expect(parseCodexLogToTraceRecords(content)).toEqual([]);
  });
});
