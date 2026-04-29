// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const meta = (cwd: string, sessionId: string, ts = "2026-04-28T00:00:00.000Z"): string =>
  JSON.stringify({
    timestamp: ts,
    type: "session_meta",
    payload: { id: sessionId, cwd, originator: "codex-tui" },
  });

describe("lib/codex-projects", () => {
  let originalHome: string | undefined;
  let fakeHome: string;
  let getCodexProjects: typeof import("@/lib/codex-projects").getCodexProjects;
  let getCodexSessionsForCwd: typeof import("@/lib/codex-projects").getCodexSessionsForCwd;
  let getCodexSessionsByEncodedName: typeof import("@/lib/codex-projects").getCodexSessionsByEncodedName;

  function writeRollout(date: { y: string; m: string; d: string }, sessionId: string, content: string, mtime?: Date) {
    const dir = join(fakeHome, ".codex", "sessions", date.y, date.m, date.d);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `rollout-${date.y}-${date.m}-${date.d}T00-00-00-${sessionId}.jsonl`);
    writeFileSync(file, content);
    if (mtime) utimesSync(file, mtime, mtime);
    return file;
  }

  beforeEach(async () => {
    originalHome = process.env.HOME;
    fakeHome = mkdtempSync(join(tmpdir(), "codex-projects-"));
    process.env.HOME = fakeHome;
    vi.resetModules();
    vi.doMock("node:os", async () => {
      const actual = await vi.importActual<typeof import("node:os")>("node:os");
      return { ...actual, homedir: () => fakeHome };
    });
    vi.doMock("os", async () => {
      const actual = await vi.importActual<typeof import("os")>("os");
      return { ...actual, homedir: () => fakeHome };
    });
    ({ getCodexProjects, getCodexSessionsForCwd, getCodexSessionsByEncodedName } = await import(
      "@/lib/codex-projects"
    ));
  });

  afterEach(() => {
    if (originalHome !== undefined) process.env.HOME = originalHome;
    rmSync(fakeHome, { recursive: true, force: true });
    vi.doUnmock("node:os");
    vi.doUnmock("os");
    vi.resetModules();
  });

  it("returns [] when ~/.codex/sessions does not exist", async () => {
    const result = await getCodexProjects();
    expect(result).toEqual([]);
  });

  it("groups sessions by cwd into one ProjectFolder each", async () => {
    const sid1 = "11111111-1111-1111-1111-111111111111";
    const sid2 = "22222222-2222-2222-2222-222222222222";
    writeRollout({ y: "2026", m: "04", d: "28" }, sid1, meta("/home/u/proj-a", sid1));
    writeRollout({ y: "2026", m: "04", d: "28" }, sid2, meta("/home/u/proj-a", sid2));

    const result = await getCodexProjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("-home-u-proj-a");
    expect(result[0].path).toBe("/home/u/proj-a");
    expect(result[0].cli).toEqual(["codex"]);
    expect(result[0].isDirectory).toBe(true);
  });

  it("returns one entry per distinct cwd, sorted newest-first", async () => {
    const old = new Date("2024-01-01T00:00:00Z");
    const recent = new Date("2026-06-15T00:00:00Z");
    writeRollout(
      { y: "2024", m: "01", d: "01" },
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      meta("/home/u/old", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
      old,
    );
    writeRollout(
      { y: "2026", m: "06", d: "15" },
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      meta("/home/u/new", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
      recent,
    );

    const result = await getCodexProjects();
    expect(result.map((p) => p.path)).toEqual(["/home/u/new", "/home/u/old"]);
  });

  it("skips files with malformed first line", async () => {
    writeRollout({ y: "2026", m: "04", d: "28" }, "33333333-3333-3333-3333-333333333333", "not json\n");
    const sid = "44444444-4444-4444-4444-444444444444";
    writeRollout({ y: "2026", m: "04", d: "28" }, sid, meta("/home/u/ok", sid));

    const result = await getCodexProjects();
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("/home/u/ok");
  });

  it("skips files whose first record is not session_meta", async () => {
    const sid = "55555555-5555-5555-5555-555555555555";
    writeRollout(
      { y: "2026", m: "04", d: "28" },
      sid,
      JSON.stringify({ timestamp: "2026-04-28T00:00:00.000Z", type: "turn_context", payload: {} }) + "\n",
    );
    const result = await getCodexProjects();
    expect(result).toEqual([]);
  });

  it("skips files whose session_meta lacks a string cwd", async () => {
    const sid = "66666666-6666-6666-6666-666666666666";
    writeRollout(
      { y: "2026", m: "04", d: "28" },
      sid,
      JSON.stringify({ timestamp: "2026-04-28T00:00:00.000Z", type: "session_meta", payload: { id: sid } }) + "\n",
    );
    const result = await getCodexProjects();
    expect(result).toEqual([]);
  });

  it("skips files whose name does not contain a UUID-like sessionId", async () => {
    const dir = join(fakeHome, ".codex", "sessions", "2026", "04", "28");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "no-uuid.jsonl"), meta("/home/u/proj", "abc"));
    const result = await getCodexProjects();
    expect(result).toEqual([]);
  });

  it("getCodexSessionsForCwd filters by cwd and extracts sessionId", async () => {
    const sid1 = "77777777-7777-7777-7777-777777777777";
    const sid2 = "88888888-8888-8888-8888-888888888888";
    const sid3 = "99999999-9999-9999-9999-999999999999";
    writeRollout({ y: "2026", m: "04", d: "28" }, sid1, meta("/home/u/proj-a", sid1));
    writeRollout({ y: "2026", m: "04", d: "28" }, sid2, meta("/home/u/proj-a", sid2));
    writeRollout({ y: "2026", m: "04", d: "28" }, sid3, meta("/home/u/proj-b", sid3));

    const aSessions = await getCodexSessionsForCwd("/home/u/proj-a");
    expect(aSessions).toHaveLength(2);
    expect(aSessions.map((s) => s.sessionId).sort()).toEqual([sid1, sid2].sort());
    expect(aSessions[0].name).toMatch(/^rollout-/);
    expect(aSessions[0].path).toContain(".codex/sessions/2026/04/28/");
  });

  it("getCodexSessionsForCwd returns [] for an unknown cwd", async () => {
    const sid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    writeRollout({ y: "2026", m: "04", d: "28" }, sid, meta("/home/u/known", sid));
    const result = await getCodexSessionsForCwd("/home/u/unknown");
    expect(result).toEqual([]);
  });

  it("getCodexSessionsByEncodedName recovers cwd with dashes that decodeFolderName loses", async () => {
    // /home/u/agentic-test encodes to -home-u-agentic-test, which decodeFolderName would
    // erroneously turn into /home/u/agentic/test. Re-encoding-from-cwd preserves the dash.
    const sid = "11112222-3333-4444-5555-666677778888";
    writeRollout({ y: "2026", m: "04", d: "28" }, sid, meta("/home/u/agentic-test", sid));

    const result = await getCodexSessionsByEncodedName("-home-u-agentic-test");
    expect(result.cwd).toBe("/home/u/agentic-test");
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].sessionId).toBe(sid);
  });

  it("getCodexSessionsByEncodedName returns empty result when no session matches", async () => {
    const result = await getCodexSessionsByEncodedName("-home-u-nothing-here");
    expect(result.cwd).toBeNull();
    expect(result.sessions).toEqual([]);
  });
});
