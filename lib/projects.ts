/**
 * Server-side helpers for reading Claude Agent SDK project folders and
 * session log files from the local filesystem.
 *
 * All functions return sorted arrays (newest-first) and pre-format dates
 * so that client components can display them without hydration mismatches.
 */
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { getClaudeProjectsPath } from "./paths";
import { runtimeCache } from "./runtime-cache";
import { logWarn, logError } from "./logger";
import { formatDate } from "./utils";

export interface ProjectFolder {
  name: string;
  path: string;
  isDirectory: boolean;
  lastModified: Date;
  lastModifiedFormatted?: string; // Pre-formatted date string to avoid hydration issues
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

export async function getProjectFolders(): Promise<ProjectFolder[]> {
  try {
    const projectsPath = getClaudeProjectsPath();
    const entries = await safeReaddir(projectsPath);
    if (!entries) return [];

    const folders = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const folderPath = join(projectsPath, entry.name);
          const mtime = await getMtime(folderPath, entry.name);
          return {
            name: entry.name,
            path: folderPath,
            isDirectory: true,
            lastModified: mtime,
            lastModifiedFormatted: formatDate(mtime),
          } as ProjectFolder;
        })
    );

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

export async function getSessionFiles(projectPath: string): Promise<SessionFile[]> {
  try {
    const entries = await safeReaddir(projectPath);
    if (!entries) return [];

    const jsonlEntries = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith(".jsonl") && extractSessionId(entry.name)
    );

    const files = await Promise.all(
      jsonlEntries.map(async (entry) => {
        const filePath = join(projectPath, entry.name);
        const mtime = await getMtime(filePath, entry.name);
        return {
          name: entry.name,
          path: filePath,
          lastModified: mtime,
          lastModifiedFormatted: formatDate(mtime),
          sessionId: extractSessionId(entry.name),
        } as SessionFile;
      })
    );

    files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return files;
  } catch (error) {
    logError("Error reading session files:", error);
    return [];
  }
}

export const getCachedProjectFolders = runtimeCache(getProjectFolders, 30);

export const getCachedSessionFiles = runtimeCache(
  (projectPath: string) => getSessionFiles(projectPath),
  30
);
