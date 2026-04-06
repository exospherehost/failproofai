/**
 * Disk persistence for hook activity entries using page-sized JSONL files.
 *
 * Storage location: ~/.failproofai/cache/hook-activity/
 *
 * File structure:
 * - current.jsonl — actively written to, 0–PAGE_SIZE entries
 * - page-{timestamp}-{seq}.jsonl — rotated archive files, exactly PAGE_SIZE entries each
 *
 * The hook handler is a short-lived process so writes are synchronous (no buffer).
 * Dashboard reads are async and lazy (per-page).
 */
import {
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export const PAGE_SIZE = 25;

const DEFAULT_STORE_DIR = join(homedir(), ".failproofai", "cache", "hook-activity");
const CURRENT_FILE = "current.jsonl";

let storeDir = DEFAULT_STORE_DIR;
let rotateSeq = 0;

// ── Types ──

export interface HookActivityEntry {
  timestamp: number;
  eventType: string;
  toolName: string | null;
  policyName: string | null;
  decision: "allow" | "deny" | "instruct";
  reason: string | null;
  durationMs: number;
  sessionId?: string;
  transcriptPath?: string;
  cwd?: string;
  permissionMode?: string;
  hookEventName?: string;
}

export interface HookActivityFilters {
  decision?: "allow" | "deny" | "instruct";
  eventType?: string;
  policyName?: string;
  sessionId?: string;
}

export interface HookActivityStats {
  totalEvents: number;
  denyCount: number;
  topPolicy: string | null;
  topPolicyCount: number;
}

// ── Directory setup ──

function ensureDir(): void {
  if (!existsSync(storeDir)) {
    mkdirSync(storeDir, { recursive: true });
  }
}

// ── Writing (synchronous — hook handler is short-lived) ──

export function persistHookActivity(entry: HookActivityEntry): void {
  ensureDir();
  const currentPath = join(storeDir, CURRENT_FILE);
  const lineCount = countLines(currentPath);

  if (lineCount >= PAGE_SIZE) {
    rotate(currentPath);
  }

  const line = JSON.stringify(entry) + "\n";
  const existing = readFileSafe(currentPath);
  writeFileSync(currentPath, existing + line, "utf-8");
}

function rotate(currentPath: string): void {
  const archiveName = `page-${Date.now()}-${rotateSeq++}.jsonl`;
  const archivePath = join(storeDir, archiveName);
  renameSync(currentPath, archivePath);
}

function countLines(filePath: string): number {
  const content = readFileSafe(filePath);
  if (!content.trim()) return 0;
  return content.trim().split("\n").length;
}

function readFileSafe(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// ── Reading (lazy, per-page) ──

export function getHookActivityPage(page: number): HookActivityEntry[] {
  ensureDir();
  if (page < 1) return [];

  if (page === 1) {
    const currentPath = join(storeDir, CURRENT_FILE);
    return readJsonlFile(currentPath).reverse();
  }

  const archives = getArchiveFiles();
  const archiveIndex = page - 2;
  if (archiveIndex >= archives.length) return [];

  return readJsonlFile(join(storeDir, archives[archiveIndex])).reverse();
}

export function getHookActivityPageCount(): number {
  ensureDir();
  return 1 + getArchiveFiles().length;
}

export function getAllHookActivityEntries(): HookActivityEntry[] {
  ensureDir();

  const currentPath = join(storeDir, CURRENT_FILE);
  const currentEntries = readJsonlFile(currentPath).reverse();

  const archives = getArchiveFiles();
  const archiveEntries: HookActivityEntry[] = [];
  for (const file of archives) {
    const entries = readJsonlFile(join(storeDir, file));
    archiveEntries.push(...entries.reverse());
  }

  return [...currentEntries, ...archiveEntries];
}

function computeStats(entries: HookActivityEntry[]): HookActivityStats {
  const totalEvents = entries.length;
  let denyCount = 0;
  const policyMap = new Map<string, number>();
  for (const entry of entries) {
    if (entry.decision === "deny") denyCount++;
    if (entry.policyName) {
      policyMap.set(entry.policyName, (policyMap.get(entry.policyName) ?? 0) + 1);
    }
  }
  let topPolicy: string | null = null;
  let topPolicyCount = 0;
  for (const [name, count] of policyMap) {
    if (count > topPolicyCount) {
      topPolicy = name;
      topPolicyCount = count;
    }
  }
  return { totalEvents, denyCount, topPolicy, topPolicyCount };
}

export function searchHookActivity(
  filters: HookActivityFilters,
  page: number,
): { entries: HookActivityEntry[]; totalPages: number; page: number; stats: HookActivityStats } {
  const all = getAllHookActivityEntries();

  const filtered = all.filter((entry) => {
    if (filters.decision && entry.decision !== filters.decision) return false;
    if (filters.eventType && entry.eventType !== filters.eventType) return false;
    if (
      filters.policyName &&
      (!entry.policyName || !entry.policyName.toLowerCase().includes(filters.policyName.toLowerCase()))
    ) {
      return false;
    }
    if (
      filters.sessionId &&
      (!entry.sessionId || !entry.sessionId.toLowerCase().includes(filters.sessionId.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const entries = filtered.slice(start, start + PAGE_SIZE);
  const stats = computeStats(all);

  return { entries, totalPages, page, stats };
}

export function getHookActivityHistory(page: number): {
  entries: HookActivityEntry[];
  totalPages: number;
  page: number;
  stats: HookActivityStats;
} {
  const entries = getHookActivityPage(page);
  const totalPages = getHookActivityPageCount();
  const all = getAllHookActivityEntries();
  const stats = computeStats(all);
  return { entries, totalPages, page, stats };
}

// ── Internal helpers ──

function readJsonlFile(filePath: string): HookActivityEntry[] {
  const content = readFileSafe(filePath);
  if (!content.trim()) return [];

  const entries: HookActivityEntry[] = [];
  for (const line of content.trim().split("\n")) {
    try {
      entries.push(JSON.parse(line) as HookActivityEntry);
    } catch {
      // Skip malformed lines
    }
  }
  return entries;
}

function getArchiveFiles(): string[] {
  try {
    const files = readdirSync(storeDir);
    return files
      .filter((f) => f.startsWith("page-") && f.endsWith(".jsonl"))
      .sort((a, b) => {
        const partsA = a.slice(5, -6).split("-");
        const partsB = b.slice(5, -6).split("-");
        const tsA = parseInt(partsA[0], 10);
        const tsB = parseInt(partsB[0], 10);
        if (tsA !== tsB) return tsB - tsA;
        const seqA = partsA.length > 1 ? parseInt(partsA[1], 10) : 0;
        const seqB = partsB.length > 1 ? parseInt(partsB[1], 10) : 0;
        return seqB - seqA;
      });
  } catch {
    return [];
  }
}

// ── Test helpers ──

export function _resetForTest(testDir?: string): void {
  rotateSeq = 0;
  storeDir = testDir ?? DEFAULT_STORE_DIR;
}
