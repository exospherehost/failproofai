/**
 * Server-side helpers for reading GitHub Copilot session data from the local filesystem.
 *
 * Copilot stores per-session event logs under:
 *   ~/.copilot/session-state/<sessionId>/events.jsonl
 *
 * Each subdirectory name is the UUID session ID.
 * We read directory metadata only (no full log parsing) for the sessions list;
 * individual session detail pages can stream the events.jsonl directly.
 */
import { readdir, stat, readFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { runtimeCache } from "./runtime-cache";
import { logWarn, logError } from "./logger";
import { formatDate } from "./utils";

export interface CopilotSession {
  sessionId: string;
  path: string;
  eventsPath: string;
  lastModified: Date;
  lastModifiedFormatted?: string;
  eventCount?: number;
}

export function getCopilotSessionStateDir(): string {
  return join(homedir(), ".copilot", "session-state");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Safely stat a path; returns null on error. */
async function safeStat(p: string) {
  try { return await stat(p); } catch { return null; }
}

/**
 * Count lines in a file quickly by scanning for newlines.
 * Returns 0 if the file doesn't exist or can't be read.
 */
async function countLines(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) return 0;
    return content.trim().split("\n").length;
  } catch {
    return 0;
  }
}

export async function getCopilotSessions(): Promise<CopilotSession[]> {
  const stateDir = getCopilotSessionStateDir();
  try {
    const s = await safeStat(stateDir);
    if (!s?.isDirectory()) return [];

    const entries = await readdir(stateDir, { withFileTypes: true });
    const sessionEntries = entries.filter((e) => e.isDirectory() && UUID_RE.test(e.name));

    const settled = await Promise.allSettled(
      sessionEntries.map(async (entry) => {
        const sessionPath = join(stateDir, entry.name);
        const eventsPath = join(sessionPath, "events.jsonl");

        const [dirStat, eventCount] = await Promise.all([
          safeStat(sessionPath),
          countLines(eventsPath),
        ]);

        const mtime = dirStat?.mtime ?? new Date(0);
        return {
          sessionId: entry.name,
          path: sessionPath,
          eventsPath,
          lastModified: mtime,
          lastModifiedFormatted: formatDate(mtime),
          eventCount,
        } as CopilotSession;
      }),
    );

    const sessions = settled
      .filter((r): r is PromiseFulfilledResult<CopilotSession> => r.status === "fulfilled")
      .map((r) => r.value);

    sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return sessions;
  } catch (error) {
    logError("Error reading Copilot session-state directory:", error);
    return [];
  }
}

export async function getCopilotSessionEvents(sessionId: string): Promise<Record<string, unknown>[]> {
  if (!UUID_RE.test(sessionId)) {
    logWarn("getCopilotSessionEvents: invalid sessionId", sessionId);
    return [];
  }
  const eventsPath = join(getCopilotSessionStateDir(), sessionId, "events.jsonl");
  try {
    const content = await readFile(eventsPath, "utf8");
    const events: Record<string, unknown>[] = [];
    for (const line of content.trim().split("\n")) {
      try { events.push(JSON.parse(line) as Record<string, unknown>); } catch { /* skip */ }
    }
    return events;
  } catch {
    return [];
  }
}

export const getCachedCopilotSessions = runtimeCache(getCopilotSessions, 15);
