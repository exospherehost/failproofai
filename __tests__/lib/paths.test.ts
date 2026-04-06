// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock os module before importing paths
vi.mock("os", () => ({
  homedir: vi.fn(() => "/mock/home"),
}));

import { decodeFolderName, getDefaultClaudeProjectsPath, getClaudeProjectsPath } from "@/lib/paths";

describe("decodeFolderName", () => {
  it("decodes Windows drive-letter path: C--code-project", () => {
    expect(decodeFolderName("C--code-project")).toBe("C:/code/project");
  });

  it("decodes Unix path: -home-user-project", () => {
    expect(decodeFolderName("-home-user-project")).toBe("/home/user/project");
  });

  it("handles name with no dashes", () => {
    expect(decodeFolderName("project")).toBe("project");
  });

  it("handles single dash (root path)", () => {
    expect(decodeFolderName("-")).toBe("/");
  });
});

describe("getDefaultClaudeProjectsPath", () => {
  it("returns {homedir}/.claude/projects", () => {
    const result = getDefaultClaudeProjectsPath();
    expect(result).toContain(".claude");
    expect(result).toContain("projects");
    expect(result).toContain("/mock/home");
  });
});

describe("getClaudeProjectsPath", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns CLAUDE_PROJECTS_PATH when set", () => {
    process.env.CLAUDE_PROJECTS_PATH = "/custom/path";
    expect(getClaudeProjectsPath()).toBe("/custom/path");
  });

  it("falls back to default when CLAUDE_PROJECTS_PATH is not set", () => {
    delete process.env.CLAUDE_PROJECTS_PATH;
    const result = getClaudeProjectsPath();
    expect(result).toContain(".claude");
    expect(result).toContain("projects");
  });
});
