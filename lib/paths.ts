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

export function getOpencodeLogPath(): string {
  return process.env.OPENCODE_LOG_PATH ?? join(homedir(), ".local", "share", "opencode", "log");
}

export function getOpencodeStoragePath(): string {
  return process.env.OPENCODE_STORAGE_PATH ?? join(homedir(), ".local", "share", "opencode");
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
  // Linux/macOS: Claude only adds a leading dash if the path was absolute (starting with /).
  // We should only replace dashes with slashes if we can be reasonably sure they were delimiters.
  // A simple but effective heuristic: if it starts with a dash, it's an absolute path.
  // This prevents mangling folder names that contain internal dashes (e.g., checks-all-integration).
  if (name.startsWith("-")) {
    return "/" + name.slice(1).replace(/-/g, "/");
  }
  return name.replace(/-/g, "/");
}

/**
 * Encodes a filesystem path to a Claude-style project folder name.
 * This is the inverse of decodeFolderName.
 *
 * Linux/macOS: `/home/user/project` → `-home-user-project`
 * Windows: `C:/code/project` → `C--code-project`
 */
export function encodeCwd(cwd: string): string {
  if (/^[A-Za-z]:[\\/]/.test(cwd)) {
    // Windows: drive letter + colon → drive letter + dash, slashes → dashes
    return cwd[0] + "-" + cwd.slice(2).replace(/[\\/]/g, "-");
  }
  // Linux/macOS: replace all slashes with dashes
  return cwd.replace(/[\\/]/g, "-");
}

export function getClaudeProjectsPath(): string {
  // Check if path is provided via environment variable
  const envPath = process.env.CLAUDE_PROJECTS_PATH;
  
  if (envPath) {
    return envPath;
  }
  
  return getDefaultClaudeProjectsPath();
}
