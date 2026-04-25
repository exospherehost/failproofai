// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

const CONFIG_PATH = resolve(homedir(), ".failproofai", "policies-config.json");

describe("hooks/hooks-config", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  describe("readHooksConfig", () => {
    it("returns empty enabledPolicies when file does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const { readHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readHooksConfig();
      expect(config).toEqual({ enabledPolicies: [] });
    });

    it("reads and parses existing config", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ enabledPolicies: ["block-sudo", "block-rm-rf"] }),
      );
      const { readHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readHooksConfig();
      expect(config.enabledPolicies).toEqual(["block-sudo", "block-rm-rf"]);
    });

    it("returns empty enabledPolicies on invalid JSON", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("not json");
      const { readHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readHooksConfig();
      expect(config).toEqual({ enabledPolicies: [] });
    });
  });

  describe("writeHooksConfig", () => {
    it("writes config to the correct path", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const { writeHooksConfig } = await import("../../src/hooks/hooks-config");
      writeHooksConfig({ enabledPolicies: ["block-sudo"] });
      expect(writeFileSync).toHaveBeenCalledOnce();
      const [path, content] = vi.mocked(writeFileSync).mock.calls[0];
      expect(path).toBe(CONFIG_PATH);
      const parsed = JSON.parse(content as string);
      expect(parsed.enabledPolicies).toEqual(["block-sudo"]);
    });

    it("creates directory if it does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const { writeHooksConfig } = await import("../../src/hooks/hooks-config");
      writeHooksConfig({ enabledPolicies: [] });
      expect(mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining(".failproofai"),
        { recursive: true },
      );
    });
  });

  describe("readMergedHooksConfig", () => {
    const CWD = "/tmp/test-project";
    const projectPath = resolve(CWD, ".failproofai", "policies-config.json");
    const localPath = resolve(CWD, ".failproofai", "policies-config.local.json");
    const globalPath = resolve(homedir(), ".failproofai", "policies-config.json");

    function mockFiles(files: Record<string, object>): void {
      vi.mocked(existsSync).mockImplementation((p) => String(p) in files);
      vi.mocked(readFileSync).mockImplementation((p) => {
        const key = String(p);
        if (key in files) return JSON.stringify(files[key]);
        throw new Error("ENOENT");
      });
    }

    it("returns empty enabledPolicies when no config files exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.enabledPolicies).toEqual([]);
      expect(config.policyParams).toBeUndefined();
      expect(config.customPoliciesPath).toBeUndefined();
    });

    it("returns global config when only global exists", async () => {
      mockFiles({
        [globalPath]: { enabledPolicies: ["block-sudo", "sanitize-jwt"] },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.enabledPolicies).toEqual(expect.arrayContaining(["block-sudo", "sanitize-jwt"]));
    });

    it("unions enabledPolicies across all three scopes", async () => {
      mockFiles({
        [projectPath]: { enabledPolicies: ["block-sudo"] },
        [localPath]: { enabledPolicies: ["block-rm-rf"] },
        [globalPath]: { enabledPolicies: ["sanitize-jwt"] },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.enabledPolicies).toEqual(
        expect.arrayContaining(["block-sudo", "block-rm-rf", "sanitize-jwt"]),
      );
      expect(config.enabledPolicies).toHaveLength(3);
    });

    it("deduplicates enabledPolicies across scopes", async () => {
      mockFiles({
        [projectPath]: { enabledPolicies: ["block-sudo", "sanitize-jwt"] },
        [globalPath]: { enabledPolicies: ["block-sudo", "block-rm-rf"] },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      const names = config.enabledPolicies;
      // block-sudo should appear only once
      expect(names.filter((n) => n === "block-sudo")).toHaveLength(1);
      expect(names).toHaveLength(3);
    });

    it("policyParams: project scope wins over global for same policy", async () => {
      mockFiles({
        [projectPath]: { enabledPolicies: [], policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl"] } } },
        [globalPath]: { enabledPolicies: [], policyParams: { "block-sudo": { allowPatterns: ["sudo make"] } } },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.policyParams?.["block-sudo"]).toEqual({ allowPatterns: ["sudo systemctl"] });
    });

    it("policyParams: global fills in policies absent from project", async () => {
      mockFiles({
        [projectPath]: { enabledPolicies: [], policyParams: { "block-sudo": { allowPatterns: ["sudo make"] } } },
        [globalPath]: { enabledPolicies: [], policyParams: { "block-rm-rf": { allowPaths: ["/tmp"] } } },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.policyParams?.["block-sudo"]).toEqual({ allowPatterns: ["sudo make"] });
      expect(config.policyParams?.["block-rm-rf"]).toEqual({ allowPaths: ["/tmp"] });
    });

    it("policyParams: local overrides global, project overrides local", async () => {
      mockFiles({
        [projectPath]: { enabledPolicies: [], policyParams: { "block-push-master": { protectedBranches: ["release"] } } },
        [localPath]: { enabledPolicies: [], policyParams: { "block-push-master": { protectedBranches: ["main", "staging"] } } },
        [globalPath]: { enabledPolicies: [], policyParams: { "block-push-master": { protectedBranches: ["main"] } } },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      // project wins for block-push-master
      expect(config.policyParams?.["block-push-master"]).toEqual({ protectedBranches: ["release"] });
    });

    it("customPoliciesPath: first scope that defines it wins", async () => {
      mockFiles({
        [localPath]: { enabledPolicies: [], customPoliciesPath: "/local/hooks.js" },
        [globalPath]: { enabledPolicies: [], customPoliciesPath: "/global/hooks.js" },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.customPoliciesPath).toBe("/local/hooks.js");
    });

    it("customPoliciesPath: project scope wins over local", async () => {
      mockFiles({
        [projectPath]: { enabledPolicies: [], customPoliciesPath: "/project/hooks.js" },
        [localPath]: { enabledPolicies: [], customPoliciesPath: "/local/hooks.js" },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.customPoliciesPath).toBe("/project/hooks.js");
    });

    it("returns no policyParams key when no params configured", async () => {
      mockFiles({
        [globalPath]: { enabledPolicies: ["block-sudo"] },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.policyParams).toBeUndefined();
    });
  });

  describe("getConfigPathForScope", () => {
    it("returns global path for user scope", async () => {
      const { getConfigPathForScope } = await import("../../src/hooks/hooks-config");
      expect(getConfigPathForScope("user")).toBe(
        resolve(homedir(), ".failproofai", "policies-config.json"),
      );
    });

    it("returns project path for project scope", async () => {
      const { getConfigPathForScope } = await import("../../src/hooks/hooks-config");
      expect(getConfigPathForScope("project", "/tmp/my-project")).toBe(
        resolve("/tmp/my-project", ".failproofai", "policies-config.json"),
      );
    });

    it("returns local path for local scope", async () => {
      const { getConfigPathForScope } = await import("../../src/hooks/hooks-config");
      expect(getConfigPathForScope("local", "/tmp/my-project")).toBe(
        resolve("/tmp/my-project", ".failproofai", "policies-config.local.json"),
      );
    });
  });

  describe("readScopedHooksConfig", () => {
    it("reads from project scope path", async () => {
      const projectPath = resolve("/tmp/proj", ".failproofai", "policies-config.json");
      vi.mocked(existsSync).mockImplementation((p) => String(p) === projectPath);
      vi.mocked(readFileSync).mockImplementation((p) => {
        if (String(p) === projectPath) return JSON.stringify({ enabledPolicies: ["block-sudo"] });
        throw new Error("ENOENT");
      });
      const { readScopedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readScopedHooksConfig("project", "/tmp/proj");
      expect(config.enabledPolicies).toEqual(["block-sudo"]);
    });

    it("returns empty config when scope file does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const { readScopedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readScopedHooksConfig("project", "/tmp/proj");
      expect(config).toEqual({ enabledPolicies: [] });
    });

    it("reads from user scope (global path)", async () => {
      const globalPath = resolve(homedir(), ".failproofai", "policies-config.json");
      vi.mocked(existsSync).mockImplementation((p) => String(p) === globalPath);
      vi.mocked(readFileSync).mockImplementation((p) => {
        if (String(p) === globalPath) return JSON.stringify({ enabledPolicies: ["sanitize-jwt"] });
        throw new Error("ENOENT");
      });
      const { readScopedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readScopedHooksConfig("user");
      expect(config.enabledPolicies).toEqual(["sanitize-jwt"]);
    });
  });

  describe("writeScopedHooksConfig", () => {
    it("writes to project scope path", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const { writeScopedHooksConfig } = await import("../../src/hooks/hooks-config");
      writeScopedHooksConfig({ enabledPolicies: ["block-sudo"] }, "project", "/tmp/proj");
      const [path, content] = vi.mocked(writeFileSync).mock.calls[0];
      expect(path).toBe(resolve("/tmp/proj", ".failproofai", "policies-config.json"));
      expect(JSON.parse(content as string).enabledPolicies).toEqual(["block-sudo"]);
    });

    it("writes to local scope path", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const { writeScopedHooksConfig } = await import("../../src/hooks/hooks-config");
      writeScopedHooksConfig({ enabledPolicies: ["block-rm-rf"] }, "local", "/tmp/proj");
      const [path] = vi.mocked(writeFileSync).mock.calls[0];
      expect(path).toBe(resolve("/tmp/proj", ".failproofai", "policies-config.local.json"));
    });

    it("writes to user scope (global path)", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const { writeScopedHooksConfig } = await import("../../src/hooks/hooks-config");
      writeScopedHooksConfig({ enabledPolicies: ["sanitize-jwt"] }, "user");
      const [path] = vi.mocked(writeFileSync).mock.calls[0];
      expect(path).toBe(resolve(homedir(), ".failproofai", "policies-config.json"));
    });

    it("creates directory if it does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      const { writeScopedHooksConfig } = await import("../../src/hooks/hooks-config");
      writeScopedHooksConfig({ enabledPolicies: [] }, "project", "/tmp/proj");
      expect(mkdirSync).toHaveBeenCalledWith(
        resolve("/tmp/proj", ".failproofai"),
        { recursive: true },
      );
    });
  });

  describe("readMergedHooksConfig — per-CLI overrides", () => {
    const CWD = "/tmp/test-project";
    const projectPath = resolve(CWD, ".failproofai", "policies-config.json");
    const localPath = resolve(CWD, ".failproofai", "policies-config.local.json");
    const globalPath = resolve(homedir(), ".failproofai", "policies-config.json");

    function mockFiles(files: Record<string, object>): void {
      vi.mocked(existsSync).mockImplementation((p) => String(p) in files);
      vi.mocked(readFileSync).mockImplementation((p) => {
        const key = String(p);
        if (key in files) return JSON.stringify(files[key]);
        throw new Error("ENOENT");
      });
    }

    it("disabledPolicies suppresses a globally enabled policy for the target CLI", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo", "block-rm-rf"],
          cli: { gemini: { disabledPolicies: ["block-rm-rf"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.enabledPolicies).toContain("block-sudo");
      expect(config.enabledPolicies).not.toContain("block-rm-rf");
    });

    it("CLI enabledPolicies adds a policy not in global, only for that CLI", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: { cursor: { enabledPolicies: ["sanitize-jwt"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const forCursor = readMergedHooksConfig(CWD, "cursor");
      expect(forCursor.enabledPolicies).toContain("block-sudo");
      expect(forCursor.enabledPolicies).toContain("sanitize-jwt");

      const forClaude = readMergedHooksConfig(CWD, "claude-code");
      expect(forClaude.enabledPolicies).toContain("block-sudo");
      expect(forClaude.enabledPolicies).not.toContain("sanitize-jwt");
    });

    it("deduplicates when same policy is in global and CLI enabledPolicies", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: { cursor: { enabledPolicies: ["block-sudo"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "cursor");
      expect(config.enabledPolicies.filter((p) => p === "block-sudo")).toHaveLength(1);
    });

    it("disabledPolicies wins when same policy is also in CLI enabledPolicies", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: {
            gemini: {
              enabledPolicies: ["block-rm-rf"],
              disabledPolicies: ["block-rm-rf"],
            },
          },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.enabledPolicies).not.toContain("block-rm-rf");
    });

    it("CLI policyParams overrides global policyParams for the same key", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          policyParams: { "block-sudo": { allowPatterns: ["sudo apt"] } },
          cli: {
            gemini: {
              policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl"] } },
            },
          },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.policyParams?.["block-sudo"]).toEqual({ allowPatterns: ["sudo systemctl"] });
    });

    it("CLI customPoliciesPath overrides global customPoliciesPath", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: [],
          customPoliciesPath: "/global/policies.js",
          cli: { gemini: { customPoliciesPath: "/gemini/policies.js" } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.customPoliciesPath).toBe("/gemini/policies.js");

      const globalConfig = readMergedHooksConfig(CWD);
      expect(globalConfig.customPoliciesPath).toBe("/global/policies.js");
    });

    it("ignores cli section entirely when no cliType arg is provided", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: { gemini: { disabledPolicies: ["block-sudo"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD);
      expect(config.enabledPolicies).toContain("block-sudo");
    });

    it("accumulates disabledPolicies from multiple scopes (union)", async () => {
      mockFiles({
        [projectPath]: {
          enabledPolicies: [],
          cli: { gemini: { disabledPolicies: ["block-sudo"] } },
        },
        [globalPath]: {
          enabledPolicies: ["block-sudo", "block-rm-rf"],
          cli: { gemini: { disabledPolicies: ["block-rm-rf"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.enabledPolicies).not.toContain("block-sudo");
      expect(config.enabledPolicies).not.toContain("block-rm-rf");
    });

    it("returns global-only result for a CLI with no cli entry in any scope", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: { cursor: { disabledPolicies: ["block-sudo"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.enabledPolicies).toContain("block-sudo");
    });
  });

  describe("readMergedHooksConfig — per-CLI collision and precedence scenarios", () => {
    const CWD = "/tmp/test-project";
    const projectPath = resolve(CWD, ".failproofai", "policies-config.json");
    const localPath = resolve(CWD, ".failproofai", "policies-config.local.json");
    const globalPath = resolve(homedir(), ".failproofai", "policies-config.json");

    function mockFiles(files: Record<string, object>): void {
      vi.mocked(existsSync).mockImplementation((p) => String(p) in files);
      vi.mocked(readFileSync).mockImplementation((p) => {
        const key = String(p);
        if (key in files) return JSON.stringify(files[key]);
        throw new Error("ENOENT");
      });
    }

    it("policyParams gap-filling: CLI has key A, global has key B — both appear in result", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo", "block-rm-rf"],
          policyParams: { "block-rm-rf": { severity: "high" } },
          cli: { gemini: { policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl"] } } } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      // CLI-level key A
      expect(config.policyParams?.["block-sudo"]).toEqual({ allowPatterns: ["sudo systemctl"] });
      // Global-level key B fills in
      expect(config.policyParams?.["block-rm-rf"]).toEqual({ severity: "high" });
    });

    it("policyParams: global fills in when no CLI policyParams override is present", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          policyParams: { "block-sudo": { allowPatterns: ["sudo apt"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.policyParams?.["block-sudo"]).toEqual({ allowPatterns: ["sudo apt"] });
    });

    it("project scope CLI policyParams wins over global scope CLI policyParams for same key", async () => {
      mockFiles({
        [projectPath]: {
          enabledPolicies: [],
          cli: { gemini: { policyParams: { "block-sudo": { allowPatterns: ["project-pattern"] } } } },
        },
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: { gemini: { policyParams: { "block-sudo": { allowPatterns: ["global-pattern"] } } } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      // project scope CLI params win (first-scope-wins)
      expect(config.policyParams?.["block-sudo"]).toEqual({ allowPatterns: ["project-pattern"] });
    });

    it("customPoliciesPath: project CLI-level wins over global CLI-level", async () => {
      mockFiles({
        [projectPath]: {
          enabledPolicies: [],
          cli: { gemini: { customPoliciesPath: "/project/gemini-policies.js" } },
        },
        [globalPath]: {
          enabledPolicies: [],
          cli: { gemini: { customPoliciesPath: "/global/gemini-policies.js" } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.customPoliciesPath).toBe("/project/gemini-policies.js");
    });

    it("customPoliciesPath: local CLI-level wins over global CLI-level", async () => {
      mockFiles({
        [localPath]: {
          enabledPolicies: [],
          cli: { gemini: { customPoliciesPath: "/local/gemini-policies.js" } },
        },
        [globalPath]: {
          enabledPolicies: [],
          cli: { gemini: { customPoliciesPath: "/global/gemini-policies.js" } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.customPoliciesPath).toBe("/local/gemini-policies.js");
    });

    it("customPoliciesPath: falls back to global non-CLI when no CLI override in any scope", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: [],
          customPoliciesPath: "/global/policies.js",
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.customPoliciesPath).toBe("/global/policies.js");
    });

    it("two CLIs suppress the same global policy independently — no cross-CLI bleed", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: {
            gemini: { disabledPolicies: ["block-sudo"] },
            cursor: { disabledPolicies: ["block-sudo"] },
          },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const forGemini = readMergedHooksConfig(CWD, "gemini");
      const forCursor = readMergedHooksConfig(CWD, "cursor");
      const forClaude = readMergedHooksConfig(CWD, "claude-code");
      expect(forGemini.enabledPolicies).not.toContain("block-sudo");
      expect(forCursor.enabledPolicies).not.toContain("block-sudo");
      // Claude Code is not in disabledPolicies, so it still sees the global policy
      expect(forClaude.enabledPolicies).toContain("block-sudo");
    });

    it("one CLI suppresses a policy while another CLI adds the same policy", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-sudo"],
          cli: {
            gemini: { disabledPolicies: ["block-sudo"] },
            cursor: { enabledPolicies: ["block-rm-rf"] },
          },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const forGemini = readMergedHooksConfig(CWD, "gemini");
      const forCursor = readMergedHooksConfig(CWD, "cursor");
      expect(forGemini.enabledPolicies).not.toContain("block-sudo");
      expect(forCursor.enabledPolicies).toContain("block-sudo");
      expect(forCursor.enabledPolicies).toContain("block-rm-rf");
    });

    it("CLI enabledPolicies from project and global scopes are unioned for same CLI", async () => {
      mockFiles({
        [projectPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["block-rm-rf"] } },
        },
        [globalPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["sanitize-jwt"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.enabledPolicies).toContain("block-rm-rf");
      expect(config.enabledPolicies).toContain("sanitize-jwt");
    });

    it("disabledPolicies from global CLI entry suppresses policy added in project CLI entry for same CLI", async () => {
      mockFiles({
        [projectPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["block-rm-rf"] } },
        },
        [globalPath]: {
          enabledPolicies: [],
          cli: { gemini: { disabledPolicies: ["block-rm-rf"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      // disable wins even when the add came from a higher-priority scope
      expect(config.enabledPolicies).not.toContain("block-rm-rf");
    });

    it("all three scopes contribute CLI enabledPolicies for same CLI — full union", async () => {
      mockFiles({
        [projectPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["policy-a"] } },
        },
        [localPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["policy-b"] } },
        },
        [globalPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["policy-c"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.enabledPolicies).toContain("policy-a");
      expect(config.enabledPolicies).toContain("policy-b");
      expect(config.enabledPolicies).toContain("policy-c");
    });

    it("CLI enabledPolicies deduped when same policy appears in project and global cli entries", async () => {
      mockFiles({
        [projectPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["block-rm-rf"] } },
        },
        [globalPath]: {
          enabledPolicies: [],
          cli: { gemini: { enabledPolicies: ["block-rm-rf"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const config = readMergedHooksConfig(CWD, "gemini");
      expect(config.enabledPolicies.filter((p) => p === "block-rm-rf")).toHaveLength(1);
    });

    it("suppressing a policy for gemini does not suppress it for cursor", async () => {
      mockFiles({
        [globalPath]: {
          enabledPolicies: ["block-rm-rf"],
          cli: { gemini: { disabledPolicies: ["block-rm-rf"] } },
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      const forGemini = readMergedHooksConfig(CWD, "gemini");
      const forCursor = readMergedHooksConfig(CWD, "cursor");
      expect(forGemini.enabledPolicies).not.toContain("block-rm-rf");
      expect(forCursor.enabledPolicies).toContain("block-rm-rf");
    });

    it("all seven IntegrationType values work as CLI keys without collision", async () => {
      const integrations = ["claude-code", "cursor", "gemini", "copilot", "codex", "opencode", "pi"] as const;
      const cliEntries: Record<string, { disabledPolicies: string[] }> = {};
      for (const id of integrations) {
        cliEntries[id] = { disabledPolicies: [`block-${id}`] };
      }
      mockFiles({
        [globalPath]: {
          enabledPolicies: integrations.map((id) => `block-${id}`),
          cli: cliEntries,
        },
      });
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      for (const id of integrations) {
        const config = readMergedHooksConfig(CWD, id);
        // Only this CLI's own policy is suppressed
        expect(config.enabledPolicies).not.toContain(`block-${id}`);
        // All other CLIs' policies are still present
        for (const other of integrations) {
          if (other !== id) {
            expect(config.enabledPolicies).toContain(`block-${other}`);
          }
        }
      }
    });
  });
});
