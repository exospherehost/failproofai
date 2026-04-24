// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { resolve, dirname } from "path";

vi.mock("fs/promises", () => ({
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock("child_process", () => ({
  spawnSync: vi.fn(),
}));

describe("hooks/loader-utils - findDistIndex", () => {
  const originalExecPath = process.execPath;

  afterEach(() => {
    Object.defineProperty(process, "execPath", { value: originalExecPath, writable: true, configurable: true });
    delete process.env.FAILPROOFAI_DIST_PATH;
    vi.resetAllMocks();
  });

  it("returns FAILPROOFAI_DIST_PATH/index.js when env var is set and file exists", async () => {
    const distDir = "/some/explicit/dist";
    process.env.FAILPROOFAI_DIST_PATH = distDir;

    const { access } = await import("fs/promises");
    vi.mocked(access).mockResolvedValue(undefined);

    const { findDistIndex } = await import("../../src/hooks/loader-utils");
    const result = await findDistIndex();
    expect(result).toBe(resolve(distDir, "index.js"));
  });

  it("returns binary-relative assets/dist/index.js for packaged install when cwd paths are absent", async () => {
    delete process.env.FAILPROOFAI_DIST_PATH;
    const fakeExecPath = "/usr/local/lib/failproofai/bin/failproofai-linux-x64";
    Object.defineProperty(process, "execPath", { value: fakeExecPath, writable: true, configurable: true });

    const expectedPath = resolve(dirname(fakeExecPath), "..", "assets", "dist", "index.js");

    const { access } = await import("fs/promises");
    vi.mocked(access).mockImplementation(async (path) => {
      if (path === expectedPath) return;
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    const { findDistIndex } = await import("../../src/hooks/loader-utils");
    const result = await findDistIndex();
    expect(result).toBe(expectedPath);
  });

  it("falls back to cwd/dist/index.js when binary-relative path does not exist", async () => {
    delete process.env.FAILPROOFAI_DIST_PATH;
    const cwdPath = resolve(process.cwd(), "dist", "index.js");

    const { access } = await import("fs/promises");
    vi.mocked(access).mockImplementation(async (path) => {
      if (path === cwdPath) return;
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    const { findDistIndex } = await import("../../src/hooks/loader-utils");
    const result = await findDistIndex();
    expect(result).toBe(cwdPath);
  });

  it("returns null when no candidate path exists", async () => {
    delete process.env.FAILPROOFAI_DIST_PATH;

    const { access } = await import("fs/promises");
    vi.mocked(access).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));

    const { findDistIndex } = await import("../../src/hooks/loader-utils");
    const result = await findDistIndex();
    expect(result).toBeNull();
  });
});

describe("hooks/loader-utils - createEsmShim", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("writes shim that exports customPolicies, allow, deny, instruct", async () => {
    const { writeFile } = await import("fs/promises");
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const { createEsmShim } = await import("../../src/hooks/loader-utils");
    const distIndex = "/dist/index.js";
    const distUrl = "file:///dist/index.js";

    const { shimPath } = await createEsmShim(distIndex, distUrl);

    expect(shimPath).toBe(`${distIndex}.__failproofai_esm_shim__.mjs`);

    expect(writeFile).toHaveBeenCalledOnce();
    const writtenContent = vi.mocked(writeFile).mock.calls[0][1] as string;
    expect(writtenContent).toContain("export const customPolicies");
    expect(writtenContent).toContain("export const allow");
    expect(writtenContent).toContain("export const deny");
    expect(writtenContent).toContain("export const instruct");
    expect(writtenContent).toContain(`from '${distUrl}'`);
  });
});

describe("hooks/loader-utils - rewriteFileTree", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rewrites 'from failproofai' to the ESM shim URL", async () => {
    const { readFile, writeFile, access } = await import("fs/promises");
    vi.mocked(access).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const entryCode = `import { customPolicies } from 'failproofai';\ncustomPolicies.add({});`;
    vi.mocked(readFile).mockImplementation(async (path: any) => {
      if (String(path).endsWith(".mjs")) return ""; // shim out file reads
      return entryCode;
    });

    const { rewriteFileTree } = await import("../../src/hooks/loader-utils");
    const entryPath = "/home/user/hooks/my-policy.js";
    const distIndex = "/dist/index.js";
    const distUrl = "file:///dist/index.js";

    await rewriteFileTree(entryPath, distUrl, distIndex);

    // The temp file for the entry should be written with the failproofai import replaced
    const writeCalls = vi.mocked(writeFile).mock.calls;
    const entryTmpWrite = writeCalls.find((c) => String(c[0]).includes("my-policy.js"));
    expect(entryTmpWrite).toBeDefined();
    const writtenCode = entryTmpWrite![1] as string;
    expect(writtenCode).not.toContain("from 'failproofai'");
    expect(writtenCode).toContain("__failproofai_esm_shim__.mjs");
  });

  it("rewrites require('failproofai') to the CJS dist path", async () => {
    const { readFile, writeFile, access } = await import("fs/promises");
    vi.mocked(access).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const entryCode = `const { customPolicies } = require('failproofai');\ncustomPolicies.add({});`;
    vi.mocked(readFile).mockImplementation(async (path: any) => {
      if (String(path).endsWith(".mjs")) return "";
      return entryCode;
    });

    const { rewriteFileTree } = await import("../../src/hooks/loader-utils");
    const entryPath = "/home/user/hooks/my-policy.js";
    const distIndex = "/dist/index.js";
    const distUrl = "file:///dist/index.js";

    await rewriteFileTree(entryPath, distUrl, distIndex);

    const writeCalls = vi.mocked(writeFile).mock.calls;
    const entryTmpWrite = writeCalls.find((c) => String(c[0]).includes("my-policy.js"));
    expect(entryTmpWrite).toBeDefined();
    const writtenCode = entryTmpWrite![1] as string;
    expect(writtenCode).not.toContain("require('failproofai')");
    expect(writtenCode).toContain("/dist/index.js");
  });

  it("handles circular imports A→B→A without infinite loop", async () => {
    const { readFile, writeFile, access } = await import("fs/promises");
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const fileA = "/home/user/hooks/a.js";
    const fileB = "/home/user/hooks/b.js";

    vi.mocked(access).mockImplementation(async (path: any) => {
      const p = String(path);
      if (p === fileA || p === fileB) return;
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });

    vi.mocked(readFile).mockImplementation(async (path: any) => {
      const p = String(path);
      if (p === fileA) return `import x from './b.js';`;
      if (p === fileB) return `import y from './a.js';`;
      if (String(p).endsWith(".mjs")) return "";
      return "";
    });

    const { rewriteFileTree } = await import("../../src/hooks/loader-utils");

    // Should resolve without error or infinite loop
    const tmpFiles = await rewriteFileTree(fileA, null, null);
    expect(tmpFiles.length).toBeGreaterThanOrEqual(2); // both a.js and b.js get temp files
  });
});

describe("hooks/loader-utils - maybeTranspileTypeScript", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns code unchanged for non-.ts files", async () => {
    const { maybeTranspileTypeScript } = await import("../../src/hooks/loader-utils");
    const code = "const x = 1;";
    const result = await maybeTranspileTypeScript(code, "/path/to/file.js");
    expect(result).toBe(code);
  });

  it("calls bun build to transpile .ts files", async () => {
    const { writeFile, readFile, unlink } = await import("fs/promises");
    const { spawnSync } = await import("child_process");

    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(unlink).mockResolvedValue(undefined);
    const transpiledCode = "const x: number = 1; // transpiled";
    vi.mocked(readFile).mockResolvedValue(transpiledCode as any);
    vi.mocked(spawnSync).mockReturnValue({ status: 0, stdout: "", stderr: "", pid: 1, output: [], signal: null, error: undefined } as any);

    const { maybeTranspileTypeScript } = await import("../../src/hooks/loader-utils");
    const tsCode = "const x: number = 1;";
    const result = await maybeTranspileTypeScript(tsCode, "/path/to/file.ts");

    expect(vi.mocked(spawnSync)).toHaveBeenCalledWith(
      "bun",
      expect.arrayContaining(["build", expect.stringContaining("__failproofai_ts_src__.ts")]),
      expect.objectContaining({ encoding: "utf-8" }),
    );
    expect(result).toBe(transpiledCode);
  });

  it("throws when bun build fails for .ts files", async () => {
    const { writeFile, unlink } = await import("fs/promises");
    const { spawnSync } = await import("child_process");

    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(unlink).mockResolvedValue(undefined);
    vi.mocked(spawnSync).mockReturnValue({ status: 1, stdout: "", stderr: "syntax error", pid: 1, output: [], signal: null, error: undefined } as any);

    const { maybeTranspileTypeScript } = await import("../../src/hooks/loader-utils");
    await expect(maybeTranspileTypeScript("const x: number = 1;", "/path/to/file.ts")).rejects.toThrow(
      "TypeScript transpilation failed",
    );
  });
});
