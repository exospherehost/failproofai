// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies - must be before imports
vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock("@/lib/paths", () => ({
  getClaudeProjectsPath: vi.fn(() => "/mock/.claude/projects"),
}));

vi.mock("@/lib/utils", () => ({
  formatDate: vi.fn((d: Date) => d.toISOString()),
}));

vi.mock("@/lib/runtime-cache", () => ({
  runtimeCache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}));

import { readdir, stat } from "fs/promises";
import { extractSessionId, getProjectFolders, getSessionFiles } from "@/lib/projects";

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
  });

  it("returns empty array when directory doesn't exist", async () => {
    mockStat.mockRejectedValueOnce(new Error("ENOENT"));
    const result = await getProjectFolders();
    expect(result).toEqual([]);
  });

  it("returns empty array when path is not a directory", async () => {
    mockStat.mockResolvedValueOnce({
      isDirectory: () => false,
    } as any);
    const result = await getProjectFolders();
    expect(result).toEqual([]);
  });

  it("returns only directories (not files)", async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true } as any);
    mockReaddir.mockResolvedValueOnce([
      { name: "project-a", isDirectory: () => true, isFile: () => false } as any,
      { name: "file.txt", isDirectory: () => false, isFile: () => true } as any,
      { name: "project-b", isDirectory: () => true, isFile: () => false } as any,
    ] as any);
    // Stat calls for each directory
    mockStat
      .mockResolvedValueOnce({ mtime: new Date("2024-06-10T00:00:00Z") } as any)
      .mockResolvedValueOnce({ mtime: new Date("2024-06-15T00:00:00Z") } as any);

    const result = await getProjectFolders();
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toContain("project-a");
    expect(result.map((f) => f.name)).toContain("project-b");
  });

  it("sorts newest-first by mtime", async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true } as any);
    mockReaddir.mockResolvedValueOnce([
      { name: "old", isDirectory: () => true, isFile: () => false } as any,
      { name: "new", isDirectory: () => true, isFile: () => false } as any,
    ] as any);
    mockStat
      .mockResolvedValueOnce({ mtime: new Date("2024-01-01T00:00:00Z") } as any)
      .mockResolvedValueOnce({ mtime: new Date("2024-06-15T00:00:00Z") } as any);

    const result = await getProjectFolders();
    expect(result[0].name).toBe("new");
    expect(result[1].name).toBe("old");
  });

  it("uses fallback Date(0) when individual stat fails", async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true } as any);
    mockReaddir.mockResolvedValueOnce([
      { name: "broken", isDirectory: () => true, isFile: () => false } as any,
    ] as any);
    mockStat.mockRejectedValueOnce(new Error("EACCES"));

    const result = await getProjectFolders();
    expect(result).toHaveLength(1);
    expect(result[0].lastModified.getTime()).toBe(0);
  });
});

describe("getSessionFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only .jsonl files with valid UUID in name", async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true } as any);
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
    mockStat.mockResolvedValueOnce({ mtime: new Date("2024-06-15T00:00:00Z") } as any);

    const result = await getSessionFiles("/some/path");
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("extracts sessionId into result", async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true } as any);
    mockReaddir.mockResolvedValueOnce([
      {
        name: "11111111-2222-3333-4444-555555555555.jsonl",
        isFile: () => true,
        isDirectory: () => false,
      } as any,
    ] as any);
    mockStat.mockResolvedValueOnce({ mtime: new Date("2024-06-15T00:00:00Z") } as any);

    const result = await getSessionFiles("/some/path");
    expect(result[0].sessionId).toBe("11111111-2222-3333-4444-555555555555");
  });

  it("sorts newest-first", async () => {
    mockStat.mockResolvedValueOnce({ isDirectory: () => true } as any);
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
    mockStat
      .mockResolvedValueOnce({ mtime: new Date("2024-01-01T00:00:00Z") } as any)
      .mockResolvedValueOnce({ mtime: new Date("2024-06-15T00:00:00Z") } as any);

    const result = await getSessionFiles("/some/path");
    expect(result[0].lastModified.getTime()).toBeGreaterThan(
      result[1].lastModified.getTime()
    );
  });

  it("returns empty array for missing directory", async () => {
    mockStat.mockRejectedValueOnce(new Error("ENOENT"));
    const result = await getSessionFiles("/nonexistent");
    expect(result).toEqual([]);
  });
});
