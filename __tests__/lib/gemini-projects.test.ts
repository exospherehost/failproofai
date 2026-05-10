// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  getGeminiSessionsForCwd,
  getGeminiSessionsByEncodedName,
} from "@/lib/gemini-projects";

const FULL_UUID = "89eb30b0-27c0-4ea3-a5b9-06fc00085610";
const PREFIX = FULL_UUID.slice(0, 8);

function header(sessionId: string, startTime = "2026-05-09T12:00:00.000Z"): string {
  return JSON.stringify({
    sessionId,
    projectHash: "deadbeef",
    startTime,
    lastUpdated: startTime,
    kind: "chat",
  });
}

describe("lib/gemini-projects", () => {
  let originalRoot: string | undefined;
  let fakeRoot: string;

  function makeProject(basename: string, cwd: string) {
    const projectDir = join(fakeRoot, basename);
    mkdirSync(join(projectDir, "chats"), { recursive: true });
    writeFileSync(join(projectDir, ".project_root"), cwd);
    return projectDir;
  }

  function writeSession(projectDir: string, prefix: string, body: string) {
    // Filename matches `session-YYYY-MM-DDTHH-MM-<8hex>.jsonl` (gemini-cli v0.40.1).
    const filename = `session-2026-05-09T12-00-${prefix}.jsonl`;
    writeFileSync(join(projectDir, "chats", filename), body);
    return filename;
  }

  beforeEach(() => {
    originalRoot = process.env.GEMINI_SESSIONS_DIR;
    fakeRoot = mkdtempSync(join(tmpdir(), "gemini-projects-"));
    process.env.GEMINI_SESSIONS_DIR = fakeRoot;
  });

  afterEach(() => {
    if (originalRoot === undefined) delete process.env.GEMINI_SESSIONS_DIR;
    else process.env.GEMINI_SESSIONS_DIR = originalRoot;
    rmSync(fakeRoot, { recursive: true, force: true });
  });

  it("exposes the full UUID from the JSONL metadata header — not the 8-char filename prefix", async () => {
    // Regression for #337: the project page rendered links with an 8-hex
    // sessionId, which the session detail route's UUID_RE check rejected (404).
    // Building the link from the metadata header's full UUID round-trips.
    const cwd = "/home/u/dev-purge";
    const projectDir = makeProject("dev-purge", cwd);
    writeSession(projectDir, PREFIX, header(FULL_UUID) + "\n");

    const byCwd = await getGeminiSessionsForCwd(cwd);
    expect(byCwd).toHaveLength(1);
    expect(byCwd[0].sessionId).toBe(FULL_UUID);
    expect(byCwd[0].sessionId).not.toBe(PREFIX);

    const byName = await getGeminiSessionsByEncodedName("-home-u-dev-purge");
    expect(byName.cwd).toBe(cwd);
    expect(byName.sessions).toHaveLength(1);
    expect(byName.sessions[0].sessionId).toBe(FULL_UUID);
  });

  it("leaves sessionId undefined when the metadata header is malformed JSON", async () => {
    // Un-parseable header → un-linked row in the dashboard. Better than a
    // clickable link to the 8-hex prefix that 404s.
    const cwd = "/home/u/broken";
    const projectDir = makeProject("broken", cwd);
    writeSession(projectDir, PREFIX, "not json\n");

    const byCwd = await getGeminiSessionsForCwd(cwd);
    expect(byCwd).toHaveLength(1);
    expect(byCwd[0].sessionId).toBeUndefined();

    const byName = await getGeminiSessionsByEncodedName("-home-u-broken");
    expect(byName.sessions).toHaveLength(1);
    expect(byName.sessions[0].sessionId).toBeUndefined();
  });

  it("leaves sessionId undefined when the metadata header lacks a sessionId field", async () => {
    const cwd = "/home/u/headerless";
    const projectDir = makeProject("headerless", cwd);
    writeSession(
      projectDir,
      PREFIX,
      JSON.stringify({ projectHash: "x", startTime: "2026-05-09T12:00:00.000Z" }) + "\n",
    );

    const byCwd = await getGeminiSessionsForCwd(cwd);
    expect(byCwd).toHaveLength(1);
    expect(byCwd[0].sessionId).toBeUndefined();
  });

  it("leaves sessionId undefined when meta.sessionId is not a UUID", async () => {
    const cwd = "/home/u/nonuuid";
    const projectDir = makeProject("nonuuid", cwd);
    writeSession(projectDir, PREFIX, header("not-a-uuid") + "\n");

    const byCwd = await getGeminiSessionsForCwd(cwd);
    expect(byCwd).toHaveLength(1);
    expect(byCwd[0].sessionId).toBeUndefined();
  });
});
