/**
 * GitHub Copilot CLI project discovery.
 *
 * Copilot stores per-session state at `~/.copilot/session-state/<sessionId>/`,
 * with a `workspace.yaml` carrying flat scalars: id, cwd, git_root, branch,
 * repository, host_type, user_named, summary_count, created_at, updated_at,
 * (optional) name, summary. We read this file (always present, even before
 * any interaction creates events.jsonl) to extract the cwd. Sessions are
 * grouped by unique cwd into `ProjectFolder` rows.
 *
 * The encoded cwd doubles as the URL slug for `/project/[name]`, matching the
 * Claude Code convention (see `encodeFolderName` in `lib/paths.ts`), so a cwd
 * present in multiple stores naturally produces the same `name` and merges in
 * `lib/projects.ts`.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { encodeFolderName } from "./paths";
import type { ProjectFolder, SessionFile } from "./projects";
import { runtimeCache } from "./runtime-cache";
import { batchAll } from "./concurrency";
import { formatDate } from "./format-date";
import { logWarn } from "./logger";

/** Inlined to avoid cross-module imports from `lib/copilot-sessions.ts` —
 *  keeping the dep tree independent prevents Turbopack from tracing
 *  Node-only modules (`fs/promises`, `os`) into the client bundle when the
 *  session viewer page statically imports `copilot-sessions`. Mirrors the
 *  pattern in `lib/codex-projects.ts`. */
function getCopilotSessionStateRoot(): string {
  return join(process.env.COPILOT_HOME || join(homedir(), ".copilot"), "session-state");
}

interface CopilotSessionMeta {
  workspacePath: string;
  eventsPath: string;
  sessionId: string;
  cwd: string;
  /** Latest of (workspace.yaml mtime, events.jsonl mtime if present). */
  fileMtime: Date;
  /** True iff `events.jsonl` exists. Workspace-only sessions (initialized but
   *  never sent a prompt) skip the `/project` session list because the viewer
   *  would only render "Session log file not found." */
  hasTranscript: boolean;
}

async function safeReaddir(dir: string) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
}

/** Extract `cwd` from a workspace.yaml file. Permissive regex parser — avoids
 *  pulling in a YAML lib for one flat scalar. Copilot writes simple
 *  `key: value` lines without nesting in this file (verified against CLI 1.0.39). */
function parseCwdFromWorkspace(text: string): string | undefined {
  const m = text.match(/^cwd\s*:\s*(.+?)\s*$/m);
  if (!m) return undefined;
  return m[1].replace(/^['"]|['"]$/g, "");
}

async function statMtime(path: string): Promise<Date | null> {
  try {
    return (await stat(path)).mtime;
  } catch {
    return null;
  }
}

async function scanCopilotSessions(): Promise<CopilotSessionMeta[]> {
  const root = getCopilotSessionStateRoot();
  const entries = await safeReaddir(root);
  if (!entries) return [];

  const candidates = entries
    .filter((e) => e.isDirectory())
    .map((e) => ({
      sessionId: e.name,
      workspacePath: join(root, e.name, "workspace.yaml"),
      eventsPath: join(root, e.name, "events.jsonl"),
    }));

  const settled = await batchAll(
    candidates.map((c) => async (): Promise<CopilotSessionMeta | null> => {
      let workspaceText: string;
      try {
        workspaceText = await readFile(c.workspacePath, "utf-8");
      } catch {
        return null;
      }
      const cwd = parseCwdFromWorkspace(workspaceText);
      if (!cwd) return null;
      // Prefer events.jsonl mtime when present (reflects last activity);
      // fall back to workspace.yaml mtime for sessions without interaction.
      const eventsMtime = await statMtime(c.eventsPath);
      const wsMtime = await statMtime(c.workspacePath);
      const hasTranscript = eventsMtime !== null;
      const fileMtime =
        eventsMtime && wsMtime
          ? new Date(Math.max(eventsMtime.getTime(), wsMtime.getTime()))
          : eventsMtime ?? wsMtime ?? new Date(0);
      return {
        workspacePath: c.workspacePath,
        eventsPath: c.eventsPath,
        sessionId: c.sessionId,
        cwd,
        fileMtime,
        hasTranscript,
      };
    }),
    16,
  );
  return settled
    .filter((r): r is PromiseFulfilledResult<CopilotSessionMeta | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is CopilotSessionMeta => v !== null);
}

const cachedScan = runtimeCache(scanCopilotSessions, 30);

/** Returns one ProjectFolder per unique cwd discovered in Copilot transcripts. */
export async function getCopilotProjects(): Promise<ProjectFolder[]> {
  let metas: CopilotSessionMeta[];
  try {
    metas = await cachedScan();
  } catch (error) {
    logWarn("Failed to scan Copilot sessions:", error);
    return [];
  }

  const byCwd = new Map<string, { latest: Date; cwd: string }>();
  for (const m of metas) {
    const existing = byCwd.get(m.cwd);
    if (!existing || m.fileMtime.getTime() > existing.latest.getTime()) {
      byCwd.set(m.cwd, { latest: m.fileMtime, cwd: m.cwd });
    }
  }

  const folders: ProjectFolder[] = [];
  for (const { cwd, latest } of byCwd.values()) {
    folders.push({
      name: encodeFolderName(cwd),
      path: cwd,
      isDirectory: true,
      lastModified: latest,
      lastModifiedFormatted: formatDate(latest),
      cli: ["copilot"],
    });
  }
  folders.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return folders;
}

function metasToSessionFiles(metas: CopilotSessionMeta[]): SessionFile[] {
  // Skip workspace-only sessions: their "openable" rows would lead to a
  // 'Session log file not found' viewer because events.jsonl doesn't exist.
  const files: SessionFile[] = metas
    .filter((m) => m.hasTranscript)
    .map((m) => ({
      name: m.sessionId,
      path: m.eventsPath,
      lastModified: m.fileMtime,
      lastModifiedFormatted: formatDate(m.fileMtime),
      sessionId: m.sessionId,
      cli: "copilot",
    }));
  files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return files;
}

/** Returns SessionFile entries for every Copilot transcript whose cwd matches `cwd` exactly. */
export async function getCopilotSessionsForCwd(cwd: string): Promise<SessionFile[]> {
  let metas: CopilotSessionMeta[];
  try {
    metas = await cachedScan();
  } catch (error) {
    logWarn("Failed to scan Copilot sessions:", error);
    return [];
  }
  return metasToSessionFiles(metas.filter((m) => m.cwd === cwd));
}

export interface CopilotProjectByName {
  cwd: string | null;
  sessions: SessionFile[];
}

/**
 * Looks up Copilot sessions for a project URL slug. `decodeFolderName` is lossy
 * (every `-` becomes `/`), so we re-encode each session's cwd and match in
 * that direction. Returns both the canonical cwd and the matching sessions.
 */
export async function getCopilotSessionsByEncodedName(name: string): Promise<CopilotProjectByName> {
  let metas: CopilotSessionMeta[];
  try {
    metas = await cachedScan();
  } catch (error) {
    logWarn("Failed to scan Copilot sessions:", error);
    return { cwd: null, sessions: [] };
  }
  const matches = metas.filter((m) => encodeFolderName(m.cwd) === name);
  return {
    cwd: matches[0]?.cwd ?? null,
    sessions: metasToSessionFiles(matches),
  };
}

export const getCachedCopilotProjects = runtimeCache(getCopilotProjects, 30);
export const getCachedCopilotSessionsForCwd = runtimeCache(
  (cwd: string) => getCopilotSessionsForCwd(cwd),
  30,
  { maxSize: 50 },
);
export const getCachedCopilotSessionsByEncodedName = runtimeCache(
  (name: string) => getCopilotSessionsByEncodedName(name),
  30,
  { maxSize: 50 },
);
