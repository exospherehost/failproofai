import { access } from "fs/promises";
import { join, relative } from "path";

/**
 * Resolve a subagent log file path by trying candidate locations in priority order.
 * Returns the file path that exists, or null if none found.
 */
export async function resolveSubagentPath(
  projectsPath: string,
  projectName: string,
  sessionId: string,
  agentId: string
): Promise<string | null> {
  const fileName = `agent-${agentId}.jsonl`;
  const candidatePaths = [
    join(projectsPath, projectName, fileName),
    join(projectsPath, projectName, sessionId, fileName),
    join(projectsPath, projectName, sessionId, "subagents", fileName),
  ];

  for (const candidatePath of candidatePaths) {
    if (relative(projectsPath, candidatePath).startsWith("..")) {
      continue;
    }
    try {
      await access(candidatePath);
      return candidatePath;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") continue;
    }
  }

  return null;
}
