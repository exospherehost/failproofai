/**
 * OS-aware path resolution for the `.claude/projects` directory.
 *
 * Supports an optional `CLAUDE_PROJECTS_PATH` environment variable
 * override; otherwise defaults to `~/.claude/projects` on all platforms.
 */
import { homedir } from "os";
import { join } from "path";

/**
 * Returns the path to GitHub Copilot's per-session event-log directory.
 * Each subdirectory is a UUID session ID containing an events.jsonl file.
 *
 * Supports COPILOT_SESSION_STATE_PATH env override for testing.
 */
export function getCopilotSessionStatePath(): string {
  return process.env.COPILOT_SESSION_STATE_PATH ?? join(homedir(), ".copilot", "session-state");
}

export function getDefaultClaudeProjectsPath(): string {
  // ~/.claude/projects on all platforms (including Windows)
  return join(homedir(), ".claude", "projects");
}

/**
 * Decodes a Claude project folder name back to its original filesystem path.
 *
 * Claude encodes project paths by replacing path separators with `-`.
 * On Windows, `C:/code/project` becomes `C--code-project` (`:` → `-`, `/` → `-`).
 * On Linux/macOS, `/home/user/project` becomes `-home-user-project`.
 *
 * This function reverses that encoding.
 */
export function decodeFolderName(name: string): string {
  // Windows drive-letter pattern: "C--rest-of-path"
  if (/^[A-Za-z]--/.test(name)) {
    return name[0] + ":/" + name.slice(3).replace(/-/g, "/");
  }
  return name.replace(/-/g, "/");
}

export function getClaudeProjectsPath(): string {
  // Check if path is provided via environment variable
  const envPath = process.env.CLAUDE_PROJECTS_PATH;
  
  if (envPath) {
    return envPath;
  }
  
  return getDefaultClaudeProjectsPath();
}

