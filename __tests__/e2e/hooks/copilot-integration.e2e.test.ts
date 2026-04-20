import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { CopilotPayloads } from "../helpers/payloads";
import {
  _resetForTest,
  getAllHookActivityEntries,
  searchHookActivity,
} from "../../../src/hooks/hook-activity-store";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const PROJECT_DIR = resolve(__dirname, "../../fixtures/copilot-project");
const HOME_DIR = resolve(PROJECT_DIR, ".test-home");
const COPILOT_HOME = resolve(HOME_DIR, ".copilot");
const COPILOT_CONFIG_PATH = resolve(COPILOT_HOME, "config.json");
const COPILOT_SESSION_STATE_DIR = resolve(COPILOT_HOME, "session-state");
const COPILOT_PROJECT_HOOKS_PATH = resolve(PROJECT_DIR, ".github", "hooks", "failproofai.json");
const BASHRC_PATH = resolve(HOME_DIR, ".bashrc");
const ACTIVITY_DIR = resolve(HOME_DIR, ".failproofai", "cache", "hook-activity");
const DEDUP_DIR = resolve(HOME_DIR, ".failproofai", "cache", "dedup");
const COPILOT_SESSION_ID = "11111111-2222-3333-4444-555555555555";

function cliEnv(extraEnv: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HOME: HOME_DIR,
    COPILOT_HOME,
    FAILPROOFAI_DIST_PATH: process.cwd(),
    FAILPROOFAI_TELEMETRY_DISABLED: "1",
    FAILPROOFAI_SKIP_KILL: "true",
    ...extraEnv,
  };
}

function resetActivityStore(): void {
  _resetForTest(ACTIVITY_DIR);
}

function readCopilotConfig(): Record<string, any> {
  return JSON.parse(readFileSync(COPILOT_CONFIG_PATH, "utf8"));
}

function readActivityEntries(sessionId?: string) {
  resetActivityStore();
  if (sessionId) {
    return searchHookActivity({ sessionId }, 1).entries;
  }
  return getAllHookActivityEntries();
}

function runCopilotHook(
  event: string,
  payload: Record<string, unknown> | string,
  extraEnv: NodeJS.ProcessEnv = {},
  integration = "copilot",
) {
  return spawnSync("bun", [BINARY_PATH, "--hook", event, "--integration", integration], {
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    cwd: PROJECT_DIR,
    env: cliEnv(extraEnv),
    encoding: "utf8",
  });
}

describe("E2E: Copilot Integration", () => {
  beforeEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
    mkdirSync(PROJECT_DIR, { recursive: true });
    mkdirSync(resolve(PROJECT_DIR, ".github", "hooks"), { recursive: true });
    mkdirSync(COPILOT_HOME, { recursive: true });
    mkdirSync(COPILOT_SESSION_STATE_DIR, { recursive: true });
    writeFileSync(BASHRC_PATH, "# shell rc\n", "utf8");
    writeFileSync(COPILOT_CONFIG_PATH, JSON.stringify({ version: 1, hooks: {} }, null, 2) + "\n", "utf8");
    if (existsSync(ACTIVITY_DIR)) rmSync(ACTIVITY_DIR, { recursive: true, force: true });
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
    resetActivityStore();
  });

  afterEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
  });

  it("installs project hooks with Copilot native camelCase event names", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --integration copilot --scope project`, {
      cwd: PROJECT_DIR,
      env: cliEnv(),
    });

    const hooks = JSON.parse(readFileSync(COPILOT_PROJECT_HOOKS_PATH, "utf8"));

    expect(hooks.version).toBe(1);
    expect(hooks.hooks.sessionStart[0].bash).toContain("--hook sessionStart --integration copilot");
    expect(hooks.hooks.preToolUse[0].bash).toContain("--hook preToolUse --integration copilot");
    expect(hooks.hooks.userPromptSubmitted[0].bash).toContain("--hook userPromptSubmitted --integration copilot");
    expect(hooks.hooks.SessionStart).toBeUndefined();
    expect(hooks.hooks.PreToolUse).toBeUndefined();
  });

  it("installs user hooks without wiping existing config and appends copilot-sync bootstrap", () => {
    writeFileSync(
      COPILOT_CONFIG_PATH,
      JSON.stringify({
        version: 1,
        copilotTokens: ["keep-me"],
        loggedInUsers: [{ login: "octocat" }],
        hooks: {
          customEvent: [{ bash: "echo untouched" }],
        },
      }, null, 2) + "\n",
      "utf8",
    );

    execSync(`bun ${BINARY_PATH} policies --install block-sudo --integration copilot --scope user`, {
      cwd: PROJECT_DIR,
      env: cliEnv(),
    });

    const config = readCopilotConfig();
    const bashrc = readFileSync(BASHRC_PATH, "utf8");

    expect(config.copilotTokens).toEqual(["keep-me"]);
    expect(config.loggedInUsers).toEqual([{ login: "octocat" }]);
    expect(config.hooks.customEvent).toEqual([{ bash: "echo untouched" }]);
    expect(config.hooks.sessionStart[0].bash).toContain("--hook sessionStart --integration copilot");
    expect(config.hooks.preToolUse[0].bash).toContain("--hook preToolUse --integration copilot");
    expect(bashrc).toContain("env failproofai copilot-sync 2>/dev/null");
  });

  it("uninstalls only failproofai hooks and preserves unrelated Copilot config", () => {
    writeFileSync(
      COPILOT_CONFIG_PATH,
      JSON.stringify({
        version: 1,
        copilotTokens: ["keep-me"],
        hooks: {
          preToolUse: [{ bash: "echo untouched" }],
        },
      }, null, 2) + "\n",
      "utf8",
    );

    execSync(`bun ${BINARY_PATH} policies --install block-sudo --integration copilot --scope user`, {
      cwd: PROJECT_DIR,
      env: cliEnv(),
    });
    execSync(`bun ${BINARY_PATH} policies --uninstall --integration copilot --scope user`, {
      cwd: PROJECT_DIR,
      env: cliEnv(),
    });

    const config = readCopilotConfig();

    expect(config.copilotTokens).toEqual(["keep-me"]);
    expect(config.hooks.preToolUse).toEqual([{ bash: "echo untouched" }]);
    expect(config.hooks.sessionStart).toBeUndefined();
    expect(config.hooks.userPromptSubmitted).toBeUndefined();
  });

  it("denies sudo from stringified toolArgs and persists a complete Copilot activity entry", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --integration copilot --scope project`, {
      cwd: PROJECT_DIR,
      env: cliEnv(),
    });

    const payload = CopilotPayloads.preToolUse.bashViaToolArgs(
      "sudo rm -rf /",
      PROJECT_DIR,
      { sessionId: COPILOT_SESSION_ID },
    );

    const { status, stdout, stderr } = runCopilotHook("preToolUse", payload);
    const entries = readActivityEntries(COPILOT_SESSION_ID);

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.permissionDecision).toBe("deny");
    expect(stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "PreToolUse",
          integration: "copilot",
          sessionId: COPILOT_SESSION_ID,
          toolName: "bash",
          transcriptPath: join(HOME_DIR, ".copilot", "session-state", COPILOT_SESSION_ID, "events.jsonl"),
        }),
      ]),
    );
  });

  it("persists sessionStart and userPromptSubmitted for the policies page with the same session id", () => {
    const sessionStart = CopilotPayloads.sessionStart(PROJECT_DIR, { sessionId: COPILOT_SESSION_ID });
    const prompt = CopilotPayloads.userPromptSubmitted("review the diff", PROJECT_DIR, {
      sessionId: COPILOT_SESSION_ID,
    });

    const startResult = runCopilotHook("sessionStart", sessionStart);
    const promptResult = runCopilotHook("userPromptSubmitted", prompt);
    const entries = readActivityEntries(COPILOT_SESSION_ID);

    expect(startResult.status).toBe(0);
    expect(promptResult.status).toBe(0);
    expect(entries.map((entry) => entry.eventType)).toEqual(
      expect.arrayContaining(["SessionStart", "UserPromptSubmit"]),
    );
    expect(entries.every((entry) => entry.integration === "copilot")).toBe(true);
    expect(entries.every((entry) => entry.sessionId === COPILOT_SESSION_ID)).toBe(true);
  });

  it("recovers the session id from COPILOT_SESSION_ID when the payload is empty", () => {
    const result = runCopilotHook("sessionStart", "", {
      COPILOT_SESSION_ID: COPILOT_SESSION_ID,
    });
    const entries = readActivityEntries(COPILOT_SESSION_ID);

    expect(result.status).toBe(0);
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "SessionStart",
          integration: "copilot",
          sessionId: COPILOT_SESSION_ID,
          transcriptPath: join(HOME_DIR, ".copilot", "session-state", COPILOT_SESSION_ID, "events.jsonl"),
        }),
      ]),
    );
  });

  it("silently ignores corrupted legacy claude-code Copilot lifecycle duplicates", () => {
    const payload = CopilotPayloads.sessionStart(PROJECT_DIR, { sessionId: COPILOT_SESSION_ID });

    const result = runCopilotHook("sessionStart", payload, {}, "claude-code");
    const entries = readActivityEntries(COPILOT_SESSION_ID);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
    expect(result.stderr.trim()).toBe("");
    expect(entries).toEqual([]);
  });
});
