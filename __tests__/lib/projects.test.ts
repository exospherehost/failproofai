// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies - must be before imports
vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock("@/lib/paths", () => ({
  getClaudeProjectsPath: vi.fn(() => "/mock/.claude/projects"),
  getCopilotSessionStatePath: vi.fn(() => "/mock/.copilot/session-state"),
  decodeFolderName: vi.fn((name: string) => name.replace(/-/g, "/").replace(/^C\//, "C:/")),
  encodeCwd: vi.fn((cwd: string) => cwd.replace(/\//g, "-")),
}));

vi.mock("@/lib/utils", () => ({
  formatDate: vi.fn((d: Date) => d.toISOString()),
}));

vi.mock("../../src/hooks/hook-activity-store", () => ({
  getAllHookActivityEntries: vi.fn(() => []),
  persistHookActivity: vi.fn(),
  trackHookEvent: vi.fn(),
}));

import { readdir, stat } from "fs/promises";
import { extractSessionId, getProjectFolders, getSessionFiles, resolveAnyProjectPath } from "@/lib/projects";
import { getAllHookActivityEntries } from "../../src/hooks/hook-activity-store";

const mockGetAllActivity = vi.mocked(getAllHookActivityEntries);
const mockReaddir = vi.mocked(readdir);
const mockStat = vi.mocked(stat);

describe("extractSessionId", () => {
  it("extracts UUID from a valid .jsonl filename", () => {
    expect(extractSessionId("a1b2c3d4-e5f6-7890-abcd-ef1234567890.jsonl")).toBe(
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    );
  });

  it("returns undefined for non-UUID filenames", () => {
    expect(extractSessionId("not-a-uuid.jsonl")).toBeUndefined();
    expect(extractSessionId("readme.txt")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    const result = extractSessionId("A1B2C3D4-E5F6-7890-ABCD-EF1234567890.jsonl");
    expect(result).toBe("A1B2C3D4-E5F6-7890-ABCD-EF1234567890");
  });
});

describe("getProjectFolders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStat.mockReset();
    mockReaddir.mockReset();
    mockGetAllActivity.mockReset();
    mockGetAllActivity.mockReturnValue([]);
  });

  it("returns empty array when directory doesn't exist", async () => {
    mockStat.mockRejectedValueOnce(new Error("ENOENT")); // Claude
    mockStat.mockRejectedValueOnce(new Error("ENOENT")); // Copilot
    mockStat.mockRejectedValueOnce(new Error("ENOENT")); // opencode
    const result = await getProjectFolders();
    expect(result).toEqual([]);
  });

  it("returns empty array when path is not a directory", async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => false } as any); // Claude
    mockStat.mockResolvedValueOnce({ isDirectory: () => false } as any); // Copilot
    mockStat.mockResolvedValueOnce({ isDirectory: () => false } as any); // opencode
    const result = await getProjectFolders();
    expect(result).toEqual([]);
  });

  it("returns only directories (not files)", async () => {
    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p.includes(".claude/projects") && !p.endsWith("project-a") && !p.endsWith("project-b")) {
        return { isDirectory: () => true } as any;
      }
      if (p.includes(".copilot/session-state")) throw new Error("ENOENT");
      if (p.endsWith("project-a")) return { mtime: new Date("2024-06-10T00:00:00Z") } as any;
      if (p.endsWith("project-b")) return { mtime: new Date("2024-06-15T00:00:00Z") } as any;
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      { name: "project-a", isDirectory: () => true, isFile: () => false } as any,
      { name: "file.txt", isDirectory: () => false, isFile: () => true } as any,
      { name: "project-b", isDirectory: () => true, isFile: () => false } as any,
    ] as any);

    const result = await getProjectFolders();
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toContain("project-a");
    expect(result.map((f) => f.name)).toContain("project-b");
  });

  it("sorts newest-first by mtime", async () => {
    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p.includes(".claude/projects") && !p.endsWith("old") && !p.endsWith("new")) {
        return { isDirectory: () => true } as any;
      }
      if (p.includes(".copilot/session-state")) throw new Error("ENOENT");
      if (p.endsWith("old")) return { mtime: new Date("2024-01-01T00:00:00Z") } as any;
      if (p.endsWith("new")) return { mtime: new Date("2024-06-15T00:00:00Z") } as any;
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      { name: "old", isDirectory: () => true, isFile: () => false } as any,
      { name: "new", isDirectory: () => true, isFile: () => false } as any,
    ] as any);

    const result = await getProjectFolders();
    expect(result[0].name).toBe("new");
    expect(result[1].name).toBe("old");
  });

  it("uses fallback Date(0) when individual stat fails", async () => {
    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p.includes(".claude/projects") && !p.endsWith("broken")) {
        return { isDirectory: () => true } as any;
      }
      if (p.includes(".copilot/session-state")) throw new Error("ENOENT");
      if (p.endsWith("broken")) throw new Error("EACCES");
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      { name: "broken", isDirectory: () => true, isFile: () => false } as any,
    ] as any);

    const result = await getProjectFolders();
    expect(result).toHaveLength(1);
    expect(result[0].lastModified.getTime()).toBe(0);
  });

  it("includes Copilot UUID session folders as projects", async () => {
    const sessionId = "11111111-2222-3333-4444-555555555555";
    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p.includes(".claude/projects")) throw new Error("ENOENT");
      if (p.includes(".copilot/session-state") && !p.endsWith(sessionId)) {
        return { isDirectory: () => true } as any;
      }
      if (p.endsWith(sessionId)) return { mtime: new Date("2024-06-20T00:00:00Z") } as any;
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      { name: sessionId, isDirectory: () => true, isFile: () => false } as any,
      { name: "not-a-session", isDirectory: () => true, isFile: () => false } as any,
    ] as any);

    const result = await getProjectFolders();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe(sessionId);
    expect(result[0].source).toBe("copilot");
    expect(result[0].sources).toEqual(["copilot"]);
  });
});

describe("getSessionFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStat.mockReset();
    mockReaddir.mockReset();
    mockGetAllActivity.mockReset();
    mockGetAllActivity.mockReturnValue([]);
  });

  it("returns only .jsonl files with valid UUID in name", async () => {
    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p === "/some/path") return { isDirectory: () => true } as any;
      if (p.endsWith(".jsonl")) return { mtime: new Date("2024-06-15T00:00:00Z") } as any;
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      {
        name: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jsonl",
        isFile: () => true,
        isDirectory: () => false,
      } as any,
      { name: "not-uuid.jsonl", isFile: () => true, isDirectory: () => false } as any,
      { name: "readme.txt", isFile: () => true, isDirectory: () => false } as any,
      { name: "subfolder", isFile: () => false, isDirectory: () => true } as any,
    ] as any);
    const result = await getSessionFiles("/some/path");
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("extracts sessionId into result", async () => {
    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p === "/some/path") return { isDirectory: () => true } as any;
      if (p.endsWith(".jsonl")) return { mtime: new Date("2024-06-15T00:00:00Z") } as any;
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      {
        name: "11111111-2222-3333-4444-555555555555.jsonl",
        isFile: () => true,
        isDirectory: () => false,
      } as any,
    ] as any);
    const result = await getSessionFiles("/some/path");
    expect(result[0].sessionId).toBe("11111111-2222-3333-4444-555555555555");
  });

  it("sorts newest-first", async () => {
    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p === "/some/path") return { isDirectory: () => true } as any;
      if (p.endsWith("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jsonl")) return { mtime: new Date("2024-01-01T00:00:00Z") } as any;
      if (p.endsWith("11111111-2222-3333-4444-555555555555.jsonl")) return { mtime: new Date("2024-06-15T00:00:00Z") } as any;
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      {
        name: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jsonl",
        isFile: () => true,
        isDirectory: () => false,
      } as any,
      {
        name: "11111111-2222-3333-4444-555555555555.jsonl",
        isFile: () => true,
        isDirectory: () => false,
      } as any,
    ] as any);
    const result = await getSessionFiles("/some/path");
    expect(result[0].lastModified.getTime()).toBeGreaterThan(
      result[1].lastModified.getTime()
    );
  });

  it("returns empty array for missing directory", async () => {
    mockStat.mockRejectedValueOnce(new Error("ENOENT"));
    mockGetAllActivity.mockReturnValueOnce([]);
    const result = await getSessionFiles("/nonexistent");
    expect(result).toEqual([]);
  });

  it("returns Copilot events.jsonl as a session file when the project path is a UUID directory", async () => {
    const sessionId = "11111111-2222-3333-4444-555555555555";
    const projectPath = `/mock/.copilot/session-state/${sessionId}`;

    mockStat.mockImplementation(async (path: any) => {
      const p = String(path);
      if (p === projectPath) return { isDirectory: () => true } as any;
      if (p.endsWith("/events.jsonl")) return { mtime: new Date("2024-06-21T00:00:00Z") } as any;
      throw new Error("ENOENT");
    });
    mockReaddir.mockResolvedValueOnce([
      { name: "events.jsonl", isFile: () => true, isDirectory: () => false } as any,
    ] as any);

    const result = await getSessionFiles(projectPath);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        name: "events.jsonl",
        sessionId,
      }),
    );
  });

  it("returns OpenCode session from db marker path", async () => {
    mockStat.mockResolvedValueOnce({ mtime: new Date("2024-06-22T00:00:00Z") } as any);
    const result = await getSessionFiles("__fp_opencode_db__:ses_abc123");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        name: "ses_abc123",
        sessionId: "ses_abc123",
        path: "__fp_opencode_db__:ses_abc123",
      }),
    );
  });
});

describe("resolveAnyProjectPath", () => {
  it("routes UUID-shaped names to Copilot, not Claude projects", () => {
    const uuid = "86a5848b-fa06-45d2-8932-5a228ac59567";
    const result = resolveAnyProjectPath(uuid);

    expect(result.source).toBe("copilot");
    expect(result.path).toContain(".copilot/session-state");
    expect(result.path).toContain(uuid);
  });

  it("routes ses_-prefixed names to opencode", () => {
    const sessionId = "ses_abc123";
    const result = resolveAnyProjectPath(sessionId);

    expect(result.source).toBe("opencode");
    expect(result.path).toBe(`__fp_opencode_db__:${sessionId}`);
  });

  it("routes encoded CWD names (starting with -) to Claude projects", () => {
    const projectName = "-home-user-myproject";
    const result = resolveAnyProjectPath(projectName);

    expect(result.source).toBe("claude-code");
    expect(result.path).toContain(".claude/projects");
    expect(result.path).toContain(projectName);
  });

  it("throws RangeError for invalid project names", () => {
    expect(() => resolveAnyProjectPath("")).toThrow(RangeError);
    expect(() => resolveAnyProjectPath("../../etc/passwd")).toThrow(RangeError);
  });
});
