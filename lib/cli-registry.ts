/**
 * Single source of truth for agent-CLI metadata used by the dashboard, the
 * `bin/failproofai.mjs` argv parser, the install prompt, and the badge UI.
 *
 * Adding a new agent CLI = three steps:
 *   1. Extend `INTEGRATION_TYPES` in `src/hooks/types.ts` (server-side hook contract).
 *   2. Add an `Integration` impl in `src/hooks/integrations.ts` (install/uninstall plumbing).
 *   3. Add an entry to `CLI_REGISTRY` below — display label, badge classes,
 *      optional dashboard project/sessions providers (if the CLI persists
 *      session transcripts on disk).
 *
 * Everything else (filter dropdown, badge component, projects merge, session
 * fallback chain) reads from this registry and picks up the new CLI without
 * further code changes.
 */
import type { ProjectFolder } from "./projects";
import type { LogEntry } from "./log-entries";
import type { IntegrationType } from "@/src/hooks/types";

/** Canonical CLI ids the registry knows about. Mirrors `INTEGRATION_TYPES`. */
export const KNOWN_CLI_IDS = ["claude", "codex", "copilot"] as const satisfies readonly IntegrationType[];
export type CliId = (typeof KNOWN_CLI_IDS)[number];

/** Per-CLI metadata consumed by the dashboard. */
export interface CliEntry {
  id: CliId;
  label: string;
  /** Tailwind utility classes for the small CLI badge (background + text + border). */
  badgeClasses: string;
  /** Lazy import of a `getProjects`-style function for the /projects page. Omit
   *  for CLIs that don't have a discoverable on-disk project view yet. */
  getProjects?: () => Promise<ProjectFolder[]>;
  /** Lazy import of a session-log loader for the session viewer fallback chain.
   *  Returns null when this CLI doesn't have a transcript for the given id. */
  loadSessionLog?: (sessionId: string) => Promise<{
    entries: LogEntry[];
    rawLines: Record<string, unknown>[];
    cwd?: string;
    filePath: string;
  } | null>;
}

const CLI_ENTRIES: Record<CliId, CliEntry> = {
  claude: {
    id: "claude",
    label: "Claude Code",
    badgeClasses: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    // Claude project listing is handled inside `lib/projects.ts` directly
    // (predates this registry); leaving getProjects unset here keeps the merge
    // path unchanged for Claude.
  },
  codex: {
    id: "codex",
    label: "OpenAI Codex",
    badgeClasses: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    getProjects: () => import("./codex-projects").then((m) => m.getCodexProjects()),
    loadSessionLog: (sessionId) =>
      import("./codex-sessions").then((m) => m.getCachedCodexSessionLog(sessionId)),
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
    badgeClasses: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    getProjects: () => import("./copilot-projects").then((m) => m.getCopilotProjects()),
    loadSessionLog: (sessionId) =>
      import("./copilot-sessions").then((m) => m.getCachedCopilotSessionLog(sessionId)),
  },
};

export function getCliEntry(id: string): CliEntry | undefined {
  return CLI_ENTRIES[id as CliId];
}

export function listCliEntries(): CliEntry[] {
  return KNOWN_CLI_IDS.map((id) => CLI_ENTRIES[id]);
}

/** External CLIs (everything except Claude) that contribute project listings. */
export function listExternalCliEntries(): CliEntry[] {
  return listCliEntries().filter((c) => c.id !== "claude");
}

/** Display label for a CLI id. Returns the id itself if unknown. */
export function getCliLabel(id: string): string {
  return getCliEntry(id)?.label ?? id;
}

/** Badge classes for a CLI id. Falls back to Claude's classes if unknown. */
export function getCliBadgeClasses(id: string): string {
  return getCliEntry(id)?.badgeClasses ?? CLI_ENTRIES.claude.badgeClasses;
}

/** Predicate: is this id a known CLI? Useful when validating user input. */
export function isKnownCli(id: string | null | undefined): id is CliId {
  return typeof id === "string" && id in CLI_ENTRIES;
}
