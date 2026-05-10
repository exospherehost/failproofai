/**
 * Gemini CLI project discovery.
 *
 * Empirically verified against gemini-cli v0.40.1:
 *
 *   • Session-state root: `~/.gemini/tmp/<project-basename>/`. Each subdir
 *     corresponds to one project. The basename is the cwd's last path segment
 *     (lossy when two projects share a basename — but every dir carries a
 *     `.project_root` text file with the absolute cwd to disambiguate).
 *   • Project list registry: `~/.gemini/projects.json` maps absolute cwd →
 *     basename. Authoritative when present, but we read each `.project_root`
 *     anyway so the dashboard tolerates partially-pruned registries.
 *   • Per-session file: `~/.gemini/tmp/<project>/chats/session-<ISO-timestamp>-<uuid-prefix>.jsonl`.
 *     A sidecar `<file>.jsonl.tool-calls.json` may sit alongside.
 *   • File format: JSONL. First line is metadata
 *     `{sessionId, projectHash, startTime, lastUpdated, kind}`; subsequent
 *     lines are message records `{id, timestamp, type, content: [{text}]}`
 *     and `{$set: {...}}` partial updates.
 *
 * As with Cursor / Pi / OpenCode, this module is intentionally permissive — a
 * missing `~/.gemini/` returns `[]`, malformed JSONL falls open without
 * surfacing the session.
 */
import { open, readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ProjectFolder, SessionFile } from "./projects";
import { runtimeCache } from "./runtime-cache";
import { batchAll } from "./concurrency";
import { formatDate } from "./format-date";
import { encodeFolderName } from "./paths";
import { logWarn } from "./logger";

/** Filename pattern for a Gemini session JSONL:
 *  `session-<ISO-timestamp-with-dashes>-<8-hex-uuid-prefix>.jsonl`. */
const SESSION_FILE_RE = /^session-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2})-([0-9a-f]{8})\.jsonl$/i;
/** Full UUID — the filename only embeds the first 8 hex chars; the rest is on
 *  the JSONL metadata header line. The session detail route requires a full
 *  UUID, so links built from the truncated filename prefix 404. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Metadata header sits on line 1 and is well under 1 KB; 4 KB covers it
 *  comfortably without slurping a multi-MB transcript. */
const FIRST_LINE_CHUNK_BYTES = 4 * 1024;

/** Override for tests. Defaults to the live Gemini session-state root. */
function getGeminiTmpRoot(): string {
  return process.env.GEMINI_SESSIONS_DIR
    || join(homedir(), ".gemini", "tmp");
}

interface GeminiSessionMeta {
  filePath: string;
  sessionFilename: string;
  cwd: string;
  fileMtime: Date;
  /** Full UUID parsed from the JSONL metadata header (line 1). Undefined when
   *  the header is missing, malformed, or carries a non-UUID `sessionId`;
   *  callers fall through to rendering an un-linked row. */
  sessionId?: string;
}

async function safeReaddir(dir: string) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
}

async function statMtime(path: string): Promise<Date | null> {
  try {
    return (await stat(path)).mtime;
  } catch {
    return null;
  }
}

/** Read the first newline-delimited line of `filePath` without slurping the
 *  rest. Mirrors `lib/codex-projects.ts`'s readFirstLine; the Gemini metadata
 *  header is always on line 1. */
async function readFirstLine(filePath: string): Promise<string | null> {
  let fh: Awaited<ReturnType<typeof open>> | null = null;
  try {
    fh = await open(filePath, "r");
    const buf = Buffer.alloc(FIRST_LINE_CHUNK_BYTES);
    const { bytesRead } = await fh.read(buf, 0, FIRST_LINE_CHUNK_BYTES, 0);
    if (bytesRead === 0) return null;
    const slice = buf.subarray(0, bytesRead);
    const nl = slice.indexOf(0x0a); // '\n'
    const end = nl === -1 ? bytesRead : nl;
    return slice.subarray(0, end).toString("utf-8");
  } catch {
    return null;
  } finally {
    if (fh) await fh.close().catch(() => {});
  }
}

/** Extract a full-UUID `sessionId` from a JSONL metadata header line. Returns
 *  undefined on parse failure, missing field, or a non-UUID value. */
function extractFullSessionId(line: string | null): string | undefined {
  if (!line) return undefined;
  try {
    const meta = JSON.parse(line) as { sessionId?: unknown };
    if (typeof meta.sessionId !== "string") return undefined;
    return UUID_RE.test(meta.sessionId) ? meta.sessionId : undefined;
  } catch {
    return undefined;
  }
}

/** Read `.project_root` to recover the absolute cwd for a basename folder.
 *  Returns null if missing or empty (caller treats the folder as un-mappable). */
async function readProjectRoot(projectDir: string): Promise<string | null> {
  try {
    const text = await readFile(join(projectDir, ".project_root"), "utf-8");
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

async function scanGeminiSessions(): Promise<GeminiSessionMeta[]> {
  const root = getGeminiTmpRoot();
  const projectDirs = await safeReaddir(root);
  if (!projectDirs) return [];

  const out: GeminiSessionMeta[] = [];

  await batchAll(
    projectDirs
      .filter((d) => d.isDirectory())
      .map((d) => async () => {
        const projectDir = join(root, d.name);
        const cwd = await readProjectRoot(projectDir);
        if (!cwd) return;

        const chatsDir = join(projectDir, "chats");
        const files = await safeReaddir(chatsDir);
        if (!files) return;

        for (const f of files) {
          if (!f.isFile()) continue;
          if (!SESSION_FILE_RE.test(f.name)) continue;
          const filePath = join(chatsDir, f.name);
          const mtime = await statMtime(filePath);
          if (!mtime) continue;
          const sessionId = extractFullSessionId(await readFirstLine(filePath));
          out.push({ filePath, sessionFilename: f.name, cwd, fileMtime: mtime, sessionId });
        }
      }),
    16,
  );

  return out;
}

/** Returns one ProjectFolder per unique cwd that has at least one session file.
 *  `name` is the encoded full-cwd slug (`encodeFolderName(cwd)`), matching the
 *  routing scheme used by the dashboard's project URL — `mergeProjectFolders`
 *  unions by `name`, and `getGeminiSessionsByEncodedName` looks up by the same
 *  slug, so every cross-CLI merge and Gemini-only project link round-trips. */
export async function getGeminiProjects(): Promise<ProjectFolder[]> {
  const sessions = await scanGeminiSessions();
  const byCwd = new Map<string, { mtime: Date }>();
  for (const s of sessions) {
    const existing = byCwd.get(s.cwd);
    if (!existing || s.fileMtime.getTime() > existing.mtime.getTime()) {
      byCwd.set(s.cwd, { mtime: s.fileMtime });
    }
  }
  const folders: ProjectFolder[] = [...byCwd.entries()].map(([cwd, { mtime }]) => ({
    name: encodeFolderName(cwd),
    path: cwd,
    isDirectory: true,
    lastModified: mtime,
    lastModifiedFormatted: formatDate(mtime),
    cli: ["gemini"],
  }));
  folders.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return folders;
}

/** Returns SessionFile entries for the given absolute cwd. Empty if none. */
export async function getGeminiSessionsForCwd(cwd: string): Promise<SessionFile[]> {
  const sessions = await scanGeminiSessions();
  const matches = sessions.filter((s) => s.cwd === cwd);
  const files: SessionFile[] = matches.map((s) => ({
    name: s.sessionFilename,
    path: s.filePath,
    lastModified: s.fileMtime,
    lastModifiedFormatted: formatDate(s.fileMtime),
    sessionId: s.sessionId,
    cli: "gemini",
  }));
  files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return files;
}

export interface GeminiProjectByName {
  cwd: string | null;
  sessions: SessionFile[];
}

/**
 * Looks up Gemini sessions for a project URL slug. `decodeFolderName` is lossy
 * on cwds containing `-`, so we re-encode each session's cwd via
 * `encodeFolderName` and match in that direction. Returns both the canonical
 * cwd and the matching sessions. When two distinct cwds collapse to the same
 * encoded slug we return null to avoid mis-labeling the project.
 */
export async function getGeminiSessionsByEncodedName(name: string): Promise<GeminiProjectByName> {
  let metas: GeminiSessionMeta[];
  try {
    metas = await scanGeminiSessions();
  } catch (error) {
    logWarn("Failed to scan Gemini sessions:", error);
    return { cwd: null, sessions: [] };
  }
  const matches = metas.filter((m) => encodeFolderName(m.cwd) === name);
  const uniqueCwds = Array.from(new Set(matches.map((m) => m.cwd)));
  if (uniqueCwds.length !== 1) {
    return { cwd: null, sessions: [] };
  }
  const sessions = matches.map((s) => ({
    name: s.sessionFilename,
    path: s.filePath,
    lastModified: s.fileMtime,
    lastModifiedFormatted: formatDate(s.fileMtime),
    sessionId: s.sessionId,
    cli: "gemini" as const,
  }));
  sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return { cwd: uniqueCwds[0], sessions };
}

export const getCachedGeminiProjects = runtimeCache(getGeminiProjects, 30);
export const getCachedGeminiSessionsByEncodedName = runtimeCache(
  (name: string) => getGeminiSessionsByEncodedName(name),
  30,
  { maxSize: 50 },
);
