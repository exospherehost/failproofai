import { describe, it, expect } from "vitest";
import { canonicalizeToolName } from "../../src/hooks/integrations";

describe("canonicalizeToolName", () => {
  it("normalizes file write tools to 'Write'", () => {
    expect(canonicalizeToolName("WriteFile")).toBe("Write");
    expect(canonicalizeToolName("write_file")).toBe("Write");
    expect(canonicalizeToolName("save_file")).toBe("Write");
    expect(canonicalizeToolName("createfile")).toBe("Write");
  });

  it("normalizes file read tools to 'Read'", () => {
    expect(canonicalizeToolName("ReadFile")).toBe("Read");
    expect(canonicalizeToolName("read_file")).toBe("Read");
    expect(canonicalizeToolName("get_file_content")).toBe("Read");
  });

  it("normalizes shell tools to 'Bash'", () => {
    expect(canonicalizeToolName("Shell")).toBe("Bash");
    expect(canonicalizeToolName("terminal")).toBe("Bash");
    expect(canonicalizeToolName("console")).toBe("Bash");
    expect(canonicalizeToolName("sh")).toBe("Bash");
    expect(canonicalizeToolName("bash_login_shell")).toBe("Bash");
    expect(canonicalizeToolName("run_terminal_command")).toBe("Bash");
    expect(canonicalizeToolName("run_shell_command")).toBe("Bash");
    expect(canonicalizeToolName("execute_command")).toBe("Bash");
  });

  it("passes through already canonical names", () => {
    expect(canonicalizeToolName("Write")).toBe("Write");
    expect(canonicalizeToolName("Read")).toBe("Read");
    expect(canonicalizeToolName("Bash")).toBe("Bash");
  });

  it("passes through unknown tool names", () => {
    expect(canonicalizeToolName("Glob")).toBe("Glob");
    expect(canonicalizeToolName("Search")).toBe("Search");
  });

  it("handles undefined/null", () => {
    expect(canonicalizeToolName(undefined)).toBeUndefined();
  });
});
