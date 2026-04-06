/**
 * Thin wrapper around `lib/paths.ts` that re-exports the projects path
 * getter under application-specific names.  Keeps the rest of the app
 * decoupled from the low-level path module.
 */
import { getClaudeProjectsPath as getPath } from "./paths";

/**
 * Gets the configured .claude projects path
 * This can be used throughout the application to access the path
 * 
 * @returns The path to the .claude/projects directory
 * 
 * @example
 * ```ts
 * import { getClaudeProjectsPath } from '@/lib/claude-config';
 * 
 * const projectsPath = getClaudeProjectsPath();
 * // Use the path to read project files
 * ```
 */
export function getClaudeProjectsPath(): string {
  return getPath();
}

/**
 * Gets the configured .claude projects path (server-side only)
 * Use this in API routes, server components, or server actions
 * 
 * @returns The path to the .claude/projects directory
 */
export function getClaudeProjectsPathServer(): string {
  // In server-side code, we can access process.env directly
  return process.env.CLAUDE_PROJECTS_PATH || getPath();
}

