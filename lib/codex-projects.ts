/**
 * Codex (OpenAI) project discovery.
 *
 * Codex transcripts are stored at `~/.codex/sessions/<YYYY>/<MM>/<DD>/rollout-...jsonl`,
 * keyed by date — not by working directory. To list "projects" we scan every transcript,
 * read only the first record (`session_meta`, which carries `payload.cwd`), and group by cwd.
 *
 * The encoded cwd doubles as the URL slug for `/project/[name]`, matching Claude Code's
 * convention (see `encodeFolderName` in `lib/paths.ts`), so a cwd present in both stores
 * naturally produces the same `name` and can be merged on the Claude side.
 */
import { open, readdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { encodeFolderName } from "./paths";
import type { ProjectFolder, SessionFile } from "./projects";
import { runtimeCache } from "./runtime-cache";
import { batchAll } from "./concurrency";
import { formatDate } from "./format-date";
import { logWarn } from "./logger";

const CODEX_SESSIONS_ROOT = join(homedir(), ".codex", "sessions");
const SESSION_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
// session_meta records can be large (base instructions inlined), but a single record
// is unlikely to exceed a few hundred KB. 256 KB comfortably covers the first line
// without slurping a full multi-MB transcript.
const FIRST_LINE_CHUNK_BYTES = 256 * 1024;

interface CodexSessionMeta {
  filePath: string;
  fileName: string;
  cwd: string;
  sessionId: string;
  fileMtime: Date;
}

async function safeReaddir(dir: string) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
}

/** Read the first line of a file without loading the rest. */
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

function extractSessionMeta(line: string): { cwd?: string } {
  try {
    const obj = JSON.parse(line) as { type?: string; payload?: { cwd?: unknown } };
    if (obj.type !== "session_meta") return {};
    const cwd = obj.payload?.cwd;
    if (typeof cwd !== "string" || cwd.length === 0) return {};
    return { cwd };
  } catch {
    return {};
  }
}

function extractSessionId(filename: string): string | null {
  const m = filename.match(SESSION_ID_RE);
  return m ? m[0] : null;
}

async function listJsonlFiles(dir: string): Promise<string[]> {
  const entries = await safeReaddir(dir);
  if (!entries) return [];
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".jsonl"))
    .map((e) => join(dir, e.name));
}

/**
 * Walk `~/.codex/sessions/<Y>/<M>/<D>/` for every `*.jsonl` transcript and read each
 * file's first record to extract `cwd`. Files lacking a parsable `session_meta` or a
 * UUID-looking sessionId in the filename are skipped.
 */
async function scanCodexSessions(): Promise<CodexSessionMeta[]> {
  const yearDirs = await safeReaddir(CODEX_SESSIONS_ROOT);
  if (!yearDirs) return [];

  const filePaths: string[] = [];
  for (const y of yearDirs) {
    if (!y.isDirectory()) continue;
    const monthDirs = await safeReaddir(join(CODEX_SESSIONS_ROOT, y.name));
    if (!monthDirs) continue;
    for (const m of monthDirs) {
      if (!m.isDirectory()) continue;
      const dayDirs = await safeReaddir(join(CODEX_SESSIONS_ROOT, y.name, m.name));
      if (!dayDirs) continue;
      for (const d of dayDirs) {
        if (!d.isDirectory()) continue;
        const dayPath = join(CODEX_SESSIONS_ROOT, y.name, m.name, d.name);
        filePaths.push(...(await listJsonlFiles(dayPath)));
      }
    }
  }

  if (filePaths.length === 0) return [];

  const settled = await batchAll(
    filePaths.map((filePath) => async (): Promise<CodexSessionMeta | null> => {
      const sessionId = extractSessionId(filePath.split("/").pop() ?? "");
      if (!sessionId) return null;
      const line = await readFirstLine(filePath);
      if (!line) return null;
      const { cwd } = extractSessionMeta(line);
      if (!cwd) return null;
      let fileMtime: Date;
      try {
        const fh = await open(filePath, "r");
        try {
          const stat = await fh.stat();
          fileMtime = stat.mtime;
        } finally {
          await fh.close().catch(() => {});
        }
      } catch {
        fileMtime = new Date(0);
      }
      return {
        filePath,
        fileName: filePath.split("/").pop() ?? "",
        cwd,
        sessionId,
        fileMtime,
      };
    }),
    16,
  );
  return settled
    .filter((r): r is PromiseFulfilledResult<CodexSessionMeta | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is CodexSessionMeta => v !== null);
}

const cachedScan = runtimeCache(scanCodexSessions, 30);

/** Returns one ProjectFolder per unique cwd discovered in Codex transcripts. */
export async function getCodexProjects(): Promise<ProjectFolder[]> {
  let metas: CodexSessionMeta[];
  try {
    metas = await cachedScan();
  } catch (error) {
    logWarn("Failed to scan Codex sessions:", error);
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
      cli: ["codex"],
    });
  }
  folders.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return folders;
}

function metasToSessionFiles(metas: CodexSessionMeta[]): SessionFile[] {
  const files: SessionFile[] = metas.map((m) => ({
    name: m.fileName.replace(/\.jsonl$/, ""),
    path: m.filePath,
    lastModified: m.fileMtime,
    lastModifiedFormatted: formatDate(m.fileMtime),
    sessionId: m.sessionId,
    cli: "codex",
  }));
  files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return files;
}

/** Returns SessionFile entries for every Codex transcript whose cwd matches `cwd` exactly. */
export async function getCodexSessionsForCwd(cwd: string): Promise<SessionFile[]> {
  let metas: CodexSessionMeta[];
  try {
    metas = await cachedScan();
  } catch (error) {
    logWarn("Failed to scan Codex sessions:", error);
    return [];
  }
  return metasToSessionFiles(metas.filter((m) => m.cwd === cwd));
}

export interface CodexProjectByName {
  /** Original cwd recovered from the Codex transcripts (canonical, not the lossy decode). */
  cwd: string | null;
  sessions: SessionFile[];
}

/**
 * Looks up Codex sessions for a project URL slug. `decodeFolderName` is lossy
 * (every `-` becomes `/`), so we cannot recover the original cwd from the slug —
 * instead we re-encode each session's cwd and match in that direction. Returns
 * both the canonical cwd (first match wins) and the matching sessions.
 */
export async function getCodexSessionsByEncodedName(name: string): Promise<CodexProjectByName> {
  let metas: CodexSessionMeta[];
  try {
    metas = await cachedScan();
  } catch (error) {
    logWarn("Failed to scan Codex sessions:", error);
    return { cwd: null, sessions: [] };
  }
  const matches = metas.filter((m) => encodeFolderName(m.cwd) === name);
  return {
    cwd: matches[0]?.cwd ?? null,
    sessions: metasToSessionFiles(matches),
  };
}

export const getCachedCodexProjects = runtimeCache(getCodexProjects, 30);
export const getCachedCodexSessionsForCwd = runtimeCache(
  (cwd: string) => getCodexSessionsForCwd(cwd),
  30,
  { maxSize: 50 },
);
export const getCachedCodexSessionsByEncodedName = runtimeCache(
  (name: string) => getCodexSessionsByEncodedName(name),
  30,
  { maxSize: 50 },
);
