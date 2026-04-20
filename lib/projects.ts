/**
 * Server-side helpers for reading Claude Agent SDK project folders and
 * session log files from the local filesystem.
 *
 * All functions return sorted arrays (newest-first) and pre-format dates
 * so that client components can display them without hydration mismatches.
 */
import { readdir, stat } from "fs/promises";
import { join, resolve, sep, basename } from "path";
import { getClaudeProjectsPath, getCopilotSessionStatePath, getOpencodeStoragePath, encodeCwd, decodeFolderName } from "./paths";
import { runtimeCache } from "./runtime-cache";
import { batchAll } from "./concurrency";
import { logWarn, logError } from "./logger";
import { formatDate } from "./utils";
import { IntegrationType } from "@/src/hooks/types";

export const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const PATH_TRAVERSAL_RE = /(^|[\\/])\.\.($|[\\/])/;

export interface ProjectFolder {
  name: string;
  path: string;
  isDirectory: boolean;
  lastModified: Date;
  lastModifiedFormatted?: string; // Pre-formatted date string to avoid hydration issues
  source?: IntegrationType | "virtual"; // Primary/Historical source
  sources: (IntegrationType | "virtual")[]; // All integrations that have work in this project
}

export interface SessionFile {
  name: string;
  path: string;
  lastModified: Date;
  lastModifiedFormatted?: string;
  sessionId?: string;
}

/** Stats a path and returns mtime. Falls back to epoch (1970-01-01) on error
 *  so that callers always get a valid Date for sorting without try/catch. */
async function getMtime(path: string, label: string): Promise<Date> {
  try {
    return (await stat(path)).mtime;
  } catch (error) {
    logWarn(`Failed to stat ${label}:`, error);
    return new Date(0);
  }
}

/** Reads a directory safely, returning [] if it doesn't exist. */
async function safeReaddir(dirPath: string) {
  try {
    const s = await stat(dirPath);
    if (!s.isDirectory()) return null;
    return await readdir(dirPath, { withFileTypes: true });
  } catch {
    return null;
  }
}

async function readFolderEntries(
  rootPath: string,
  source: IntegrationType | "virtual",
  filter: (name: string) => boolean = () => true,
): Promise<ProjectFolder[]> {
  const entries = await safeReaddir(rootPath);
  if (!entries) return [];

  const settled = await batchAll(
    entries
      .filter((e) => e.isDirectory() && filter(e.name))
      .map((entry) => async () => {
        const folderPath = join(rootPath, entry.name);
        const mtime = await getMtime(folderPath, entry.name);
        return {
          name: entry.name,
          path: folderPath,
          isDirectory: true,
          lastModified: mtime,
          lastModifiedFormatted: formatDate(mtime),
          source,
          sources: [source],
        } as ProjectFolder;
      }),
    16,
  );
  return settled
    .filter((r): r is PromiseFulfilledResult<ProjectFolder> => r.status === "fulfilled")
    .map((r) => r.value);
}

async function readOpencodeEntries(rootPath: string): Promise<ProjectFolder[]> {
  const entries = await safeReaddir(rootPath);
  if (!entries) return [];

  const settled = await batchAll(
    entries
      .filter((e) => e.isFile() && e.name.startsWith("ses_"))
      .map((entry) => async () => {
        const filePath = join(rootPath, entry.name);
        const mtime = await getMtime(filePath, entry.name);
        return {
          name: entry.name.replace(".json", ""),
          path: filePath,
          isDirectory: false,
          lastModified: mtime,
          lastModifiedFormatted: formatDate(mtime),
          source: "opencode",
        } as ProjectFolder;
      }),
    16,
  );
  return settled
    .filter((r): r is PromiseFulfilledResult<ProjectFolder> => r.status === "fulfilled")
    .map((r) => r.value);
}

import { INTEGRATION_TYPES } from "@/src/hooks/types";
const VIRTUAL_INTEGRATIONS = INTEGRATION_TYPES as unknown as string[];

async function getVirtualProjectsFromActivityStore(): Promise<ProjectFolder[]> {
  try {
    const { getAllHookActivityEntries } = await import("../src/hooks/hook-activity-store");
    const allActivity = getAllHookActivityEntries();

    const cwdMap = new Map<string, { lastModified: Date; sources: Set<string> }>();
    for (const entry of allActivity) {
      if (!entry.cwd || !VIRTUAL_INTEGRATIONS.includes(entry.integration as any)) continue;
      const encoded = encodeCwd(entry.cwd);
      const date = new Date(entry.timestamp);
      const existing = cwdMap.get(encoded);
      if (existing) {
        if (date > existing.lastModified) existing.lastModified = date;
        existing.sources.add(entry.integration!);
      } else {
        cwdMap.set(encoded, { lastModified: date, sources: new Set([entry.integration!]) });
      }
    }

    const projectsPath = resolve(getClaudeProjectsPath());
    return Array.from(cwdMap.entries()).map(([name, { lastModified, sources }]) => ({
      name,
      path: join(projectsPath, name),
      isDirectory: true,
      lastModified,
      lastModifiedFormatted: formatDate(lastModified),
      source: Array.from(sources)[0] as IntegrationType,
      sources: Array.from(sources) as IntegrationType[],
    }));
  } catch {
    return [];
  }
}

/** Internal helper to check if an opencode session has already been merged into a workspace project */
function isOpencodeSessionMerged(sessionId: string, virtualFolders: ProjectFolder[]): boolean {
  return virtualFolders.some(f => 
    f.sources.includes("opencode") && 
    // This is a heuristic: if we have activity for opencode in a CWD, 
    // we assume the standalone session file for that CWD is redundant.
    f.name !== sessionId
  );
}

export async function getProjectFolders(): Promise<ProjectFolder[]> {
  try {
    const [claudeFolders, copilotFolders, opencodeFolders, virtualFolders] = await Promise.all([
      readFolderEntries(getClaudeProjectsPath(), "claude-code"),
      readFolderEntries(getCopilotSessionStatePath(), "copilot", (name) => UUID_RE.test(name)),
      readOpencodeEntries(join(getOpencodeStoragePath(), "session_diff")),
      getVirtualProjectsFromActivityStore(),
    ]);

    // Group projects by name (which is the encoded CWD for Claude/Opencode/Virtual)
    // Copilot folders stay unique by UUID unless we can map them (handled in virtualStore)
    const projectMap = new Map<string, ProjectFolder>();

    // We process virtual folders (activity store) first so they establish 
    // the "Live" timestamps for workspaces.
    const allFolders = [...virtualFolders, ...claudeFolders, ...copilotFolders, ...opencodeFolders];

    for (const folder of allFolders) {
      // For standalone opencode session files: skip if we've already merged opencode 
      // activity into a workspace project (unification).
      if (folder.source === "opencode" && folder.name.startsWith("ses_") && isOpencodeSessionMerged(folder.name, virtualFolders)) {
        continue;
      }

      const existing = projectMap.get(folder.name);
      if (existing) {
        // Merge sources
        if (folder.source && !existing.sources.includes(folder.source)) {
          existing.sources.push(folder.source);
        }
        // Update lastModified if newer
        if (folder.lastModified > existing.lastModified) {
          existing.lastModified = folder.lastModified;
          existing.lastModifiedFormatted = folder.lastModifiedFormatted;
        }
      } else {
        projectMap.set(folder.name, {
          ...folder,
          sources: folder.source ? [folder.source] : [],
        });
      }
    }

    const folders = Array.from(projectMap.values());
    folders.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return folders;
  } catch (error) {
    logError("Error reading project folders:", error);
    return [];
  }
}

/**
 * Gets the full path to a specific project folder
 * @param projectName - Name of the project folder
 * @returns Full path to the project folder
 */
export function getProjectPath(projectName: string): string {
  const projectsPath = getClaudeProjectsPath();
  return join(projectsPath, projectName);
}

/**
 * Resolves a project name to its absolute path, verifying it stays under
 * the Claude projects root. Throws RangeError for any invalid or escaping input.
 * Callers should catch RangeError and return 400/404 as appropriate.
 */
export function resolveProjectPath(projectName: string): string {
  if (!projectName) throw new RangeError("Empty project name");
  // Reject absolute paths before joining (catches /etc, \Windows, etc.)
  if (/^[/\\]/.test(projectName)) throw new RangeError("Absolute project name");
  const projectsPath = resolve(getClaudeProjectsPath());
  const candidate = resolve(join(projectsPath, projectName));
  // Must be strictly under the root (not equal — projects are subdirs)
  if (!candidate.startsWith(projectsPath + sep)) {
    throw new RangeError("Project path escapes root");
  }
  return candidate;
}

/**
 * Resolves a Copilot session ID to its session-state directory path, validating
 * the ID is a well-formed UUID and the path stays within the Copilot root.
 * Throws RangeError for invalid input.
 */
export function resolveCopilotSessionDir(sessionId: string): string {
  if (!UUID_RE.test(sessionId)) throw new RangeError("Invalid Copilot session ID");
  const stateRoot = resolve(getCopilotSessionStatePath());
  const candidate = resolve(join(stateRoot, sessionId));
  if (!candidate.startsWith(stateRoot + sep)) throw new RangeError("Copilot path escapes root");
  return candidate;
}

/**
 * Resolves a project/session name that may belong to either Claude Code or Copilot.
 * Returns the resolved path and which source it belongs to.
 * Throws RangeError if the name is invalid for both roots.
 */
export function resolveAnyProjectPath(
  name: string,
): { path: string; source: ProjectFolder["source"] } {
  try {
    return { path: resolveProjectPath(name), source: "claude-code" };
  } catch {
    // UUID-shaped names may be Copilot session IDs
    if (UUID_RE.test(name)) {
      return { path: resolveCopilotSessionDir(name), source: "copilot" };
    }
    if (name.startsWith("ses_")) {
      return { path: join(getOpencodeStoragePath(), "session_diff", `${name}.json`), source: "opencode" };
    }
    // If it's none of the above, it might be a virtual project name (encoded CWD)
    // resolveProjectPath will return a path under Claude root.
    try {
      return { path: resolveProjectPath(name), source: "virtual" };
    } catch {
      throw new RangeError(`Project "${name}" not found in Claude, Copilot, or opencode paths`);
    }
  }
}

/**
 * Resolves a session file path, validating both project name and session ID.
 * Throws RangeError for invalid inputs (caught by callers for 400/404).
 */
export function resolveSessionFilePath(projectName: string, sessionId: string): string {
  if (!UUID_RE.test(sessionId)) throw new RangeError("Invalid session ID");
  const projectDir = resolveProjectPath(projectName);
  return join(projectDir, `${sessionId}.jsonl`);
}

/**
 * Extracts session ID (UUID) from a filename
 * @param filename - File name to extract session ID from
 * @returns Extracted session ID or undefined if not found
 */
export function extractSessionId(filename: string): string | undefined {
  // Claude session files are named <uuid>.jsonl — extract the UUID portion
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = filename.match(uuidPattern);
  return match ? match[0] : undefined;
}

async function getActivityStoreSessionFiles(cwd: string): Promise<SessionFile[]> {
  try {
    const { getAllHookActivityEntries } = await import("../src/hooks/hook-activity-store");
    const allActivity = getAllHookActivityEntries();

    const sessionMap = new Map<string, { lastModified: Date; integration: string }>();
    for (const entry of allActivity) {
      if (!entry.sessionId || !VIRTUAL_INTEGRATIONS.includes(entry.integration as any)) continue;
      // Match by cwd — empty cwd entries are skipped
      if (entry.cwd && entry.cwd !== cwd) continue;
      const date = new Date(entry.timestamp);
      const existing = sessionMap.get(entry.sessionId);
      if (!existing || date > existing.lastModified) {
        sessionMap.set(entry.sessionId, { lastModified: date, integration: entry.integration! });
      }
    }

    return Array.from(sessionMap.entries()).map(([sessionId, { lastModified }]) => ({
      name: sessionId,
      path: `__fp_virtual__:${sessionId}`,
      lastModified,
      lastModifiedFormatted: formatDate(lastModified),
      sessionId,
    })).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch {
    return [];
  }
}

export async function getSessionFiles(projectPath: string): Promise<SessionFile[]> {
  try {
    // 1. opencode: path is the session JSON file itself, not a directory
    if (basename(projectPath).startsWith("ses_") && projectPath.includes("session_diff")) {
      const mtime = await getMtime(projectPath, basename(projectPath));
      return [{
        name: basename(projectPath),
        path: projectPath,
        lastModified: mtime,
        lastModifiedFormatted: formatDate(mtime),
        sessionId: basename(projectPath).replace(".json", ""),
      }];
    }

    const fileSessions: SessionFile[] = [];
    const entries = await safeReaddir(projectPath);

    if (entries) {
      // 2. Standard Claude session files: <uuid>.jsonl
      const jsonlEntries = entries.filter(
        (entry) => entry.isFile() && entry.name.endsWith(".jsonl") && extractSessionId(entry.name)
      );

      if (jsonlEntries.length > 0) {
        const settled = await batchAll(
          jsonlEntries.map((entry) => async () => {
            const filePath = join(projectPath, entry.name);
            const mtime = await getMtime(filePath, entry.name);
            return {
              name: entry.name,
              path: filePath,
              lastModified: mtime,
              lastModifiedFormatted: formatDate(mtime),
              sessionId: extractSessionId(entry.name),
            } as SessionFile;
          }),
          16,
        );
        fileSessions.push(
          ...settled
            .filter((r): r is PromiseFulfilledResult<SessionFile> => r.status === "fulfilled")
            .map((r) => r.value),
        );
      }

      // 3. Copilot sessions: the directory itself is the session UUID, with events.jsonl inside.
      const dirName = basename(projectPath);
      const eventsFile = entries.find((e) => e.isFile() && e.name === "events.jsonl");
      if (eventsFile && UUID_RE.test(dirName)) {
        const filePath = join(projectPath, "events.jsonl");
        const mtime = await getMtime(filePath, "events.jsonl");
        fileSessions.push({
          name: "events.jsonl",
          path: filePath,
          lastModified: mtime,
          lastModifiedFormatted: formatDate(mtime),
          sessionId: dirName,
        });
      }
    }

    // 4. Always fetch virtual integration sessions for this cwd (Cursor/Gemini/Codex/Pi)
    const cwd = decodeFolderName(basename(projectPath));
    const virtualSessions = await getActivityStoreSessionFiles(cwd);

    // Merge virtual and real sessions
    const mergedMap = new Map<string, SessionFile>();
    
    for (const s of [...fileSessions, ...virtualSessions]) {
      if (!s.sessionId) continue;
      const existing = mergedMap.get(s.sessionId);
      if (!existing || s.lastModified > existing.lastModified) {
        mergedMap.set(s.sessionId, s);
      }
    }

    const finalSessions = Array.from(mergedMap.values());
    finalSessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return finalSessions;
  } catch (error) {
    logError("Error reading session files:", error);
    return [];
  }
}

export const getCachedProjectFolders = runtimeCache(getProjectFolders, 5);

export const getCachedSessionFiles = runtimeCache(
  (projectPath: string) => getSessionFiles(projectPath),
  5
);
