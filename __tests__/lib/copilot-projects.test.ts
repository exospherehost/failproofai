// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const workspaceYaml = (cwd: string, sessionId: string): string =>
  [
    `id: ${sessionId}`,
    `cwd: ${cwd}`,
    `user_named: false`,
    `summary_count: 0`,
    `created_at: 2026-04-29T00:00:00.000Z`,
    `updated_at: 2026-04-29T00:00:00.000Z`,
  ].join("\n") + "\n";

describe("lib/copilot-projects", () => {
  let originalHome: string | undefined;
  let originalCopilotHome: string | undefined;
  let fakeHome: string;
  let getCopilotProjects: typeof import("@/lib/copilot-projects").getCopilotProjects;
  let getCopilotSessionsForCwd: typeof import("@/lib/copilot-projects").getCopilotSessionsForCwd;
  let getCopilotSessionsByEncodedName: typeof import("@/lib/copilot-projects").getCopilotSessionsByEncodedName;

  function writeSession(
    sessionId: string,
    cwd: string,
    opts?: { events?: string; workspaceMtime?: Date; eventsMtime?: Date },
  ) {
    const dir = join(fakeHome, ".copilot", "session-state", sessionId);
    mkdirSync(dir, { recursive: true });
    const ws = join(dir, "workspace.yaml");
    writeFileSync(ws, workspaceYaml(cwd, sessionId));
    if (opts?.workspaceMtime) utimesSync(ws, opts.workspaceMtime, opts.workspaceMtime);
    if (opts?.events !== undefined) {
      const ej = join(dir, "events.jsonl");
      writeFileSync(ej, opts.events);
      if (opts?.eventsMtime) utimesSync(ej, opts.eventsMtime, opts.eventsMtime);
    }
    return dir;
  }

  beforeEach(async () => {
    originalHome = process.env.HOME;
    originalCopilotHome = process.env.COPILOT_HOME;
    fakeHome = mkdtempSync(join(tmpdir(), "copilot-projects-"));
    process.env.HOME = fakeHome;
    delete process.env.COPILOT_HOME;
    vi.resetModules();
    vi.doMock("node:os", async () => {
      const actual = await vi.importActual<typeof import("node:os")>("node:os");
      return { ...actual, homedir: () => fakeHome };
    });
    vi.doMock("os", async () => {
      const actual = await vi.importActual<typeof import("os")>("os");
      return { ...actual, homedir: () => fakeHome };
    });
    ({ getCopilotProjects, getCopilotSessionsForCwd, getCopilotSessionsByEncodedName } = await import(
      "@/lib/copilot-projects"
    ));
  });

  afterEach(() => {
    if (originalHome !== undefined) process.env.HOME = originalHome;
    if (originalCopilotHome !== undefined) process.env.COPILOT_HOME = originalCopilotHome;
    rmSync(fakeHome, { recursive: true, force: true });
    vi.doUnmock("node:os");
    vi.doUnmock("os");
    vi.resetModules();
  });

  it("returns [] when ~/.copilot/session-state does not exist", async () => {
    const result = await getCopilotProjects();
    expect(result).toEqual([]);
  });

  it("groups sessions by cwd into one ProjectFolder each", async () => {
    writeSession("11111111-1111-1111-1111-111111111111", "/home/u/proj-a");
    writeSession("22222222-2222-2222-2222-222222222222", "/home/u/proj-a");

    const result = await getCopilotProjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("-home-u-proj-a");
    expect(result[0].path).toBe("/home/u/proj-a");
    expect(result[0].cli).toEqual(["copilot"]);
    expect(result[0].isDirectory).toBe(true);
  });

  it("returns one entry per distinct cwd, sorted newest-first", async () => {
    const old = new Date("2024-01-01T00:00:00Z");
    const recent = new Date("2026-06-15T00:00:00Z");
    writeSession("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "/home/u/old", { workspaceMtime: old });
    writeSession("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "/home/u/new", { workspaceMtime: recent });

    const result = await getCopilotProjects();
    expect(result.map((p) => p.path)).toEqual(["/home/u/new", "/home/u/old"]);
  });

  it("uses events.jsonl mtime when newer than workspace.yaml", async () => {
    const wsTime = new Date("2026-01-01T00:00:00Z");
    const eventsTime = new Date("2026-06-01T00:00:00Z");
    writeSession("11112222-3333-4444-5555-666677778888", "/home/u/proj", {
      events: '{"type":"user.message","data":{"content":"hi"},"id":"x","timestamp":"2026-06-01T00:00:00Z","parentId":null}\n',
      workspaceMtime: wsTime,
      eventsMtime: eventsTime,
    });
    const result = await getCopilotProjects();
    expect(result).toHaveLength(1);
    // Should pick up the events.jsonl mtime
    expect(result[0].lastModified.getTime()).toBe(eventsTime.getTime());
  });

  it("skips session directories without workspace.yaml", async () => {
    mkdirSync(join(fakeHome, ".copilot", "session-state", "no-yaml"), { recursive: true });
    const result = await getCopilotProjects();
    expect(result).toEqual([]);
  });

  it("skips workspace.yaml without a cwd field", async () => {
    const dir = join(fakeHome, ".copilot", "session-state", "no-cwd");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "workspace.yaml"), "id: no-cwd\nuser_named: false\n");
    const result = await getCopilotProjects();
    expect(result).toEqual([]);
  });

  it("strips quoted cwd values", async () => {
    const dir = join(fakeHome, ".copilot", "session-state", "quoted");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "workspace.yaml"), 'id: quoted\ncwd: "/home/u/has space"\n');
    const result = await getCopilotProjects();
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("/home/u/has space");
  });

  it("getCopilotSessionsForCwd filters by cwd", async () => {
    const sid1 = "77777777-7777-7777-7777-777777777777";
    const sid2 = "88888888-8888-8888-8888-888888888888";
    const sid3 = "99999999-9999-9999-9999-999999999999";
    writeSession(sid1, "/home/u/proj-a", { events: "{}\n" });
    writeSession(sid2, "/home/u/proj-a", { events: "{}\n" });
    writeSession(sid3, "/home/u/proj-b", { events: "{}\n" });

    const aSessions = await getCopilotSessionsForCwd("/home/u/proj-a");
    expect(aSessions).toHaveLength(2);
    expect(aSessions.map((s) => s.sessionId).sort()).toEqual([sid1, sid2].sort());
  });

  it("getCopilotSessionsForCwd returns [] for an unknown cwd", async () => {
    writeSession("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "/home/u/known", { events: "{}\n" });
    const result = await getCopilotSessionsForCwd("/home/u/unknown");
    expect(result).toEqual([]);
  });

  it("getCopilotSessionsForCwd skips workspace-only sessions (no events.jsonl)", async () => {
    const withTranscript = "77770000-1111-2222-3333-444455556666";
    const workspaceOnly = "88880000-1111-2222-3333-444455556666";
    writeSession(withTranscript, "/home/u/proj-a", { events: "{}\n" });
    writeSession(workspaceOnly, "/home/u/proj-a"); // workspace.yaml only

    const sessions = await getCopilotSessionsForCwd("/home/u/proj-a");
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionId).toBe(withTranscript);
  });

  it("getCopilotSessionsByEncodedName recovers cwd with dashes that decodeFolderName loses", async () => {
    const sid = "11112222-3333-4444-5555-666677778888";
    writeSession(sid, "/home/u/agentic-test", { events: "{}\n" });

    const result = await getCopilotSessionsByEncodedName("-home-u-agentic-test");
    expect(result.cwd).toBe("/home/u/agentic-test");
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].sessionId).toBe(sid);
  });

  it("getCopilotSessionsByEncodedName returns empty result when no session matches", async () => {
    const result = await getCopilotSessionsByEncodedName("-home-u-nothing-here");
    expect(result.cwd).toBeNull();
    expect(result.sessions).toEqual([]);
  });

  it("getCopilotSessionsByEncodedName: cwd is recovered even if all sessions are workspace-only", async () => {
    // Project still surfaces in /projects (cwd extraction succeeds), but the
    // session list filters out workspace-only entries to avoid clickable rows
    // with nonexistent transcripts.
    const sid = "11112222-3333-4444-5555-aaaabbbbcccc";
    writeSession(sid, "/home/u/no-transcript-yet"); // workspace.yaml only

    const result = await getCopilotSessionsByEncodedName("-home-u-no-transcript-yet");
    expect(result.cwd).toBe("/home/u/no-transcript-yet");
    expect(result.sessions).toEqual([]);
  });
});
