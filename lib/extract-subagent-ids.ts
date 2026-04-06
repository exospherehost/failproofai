/**
 * Extract all unique subagent IDs from raw JSONL content by scanning
 * for `toolUseResult.agentId` on user-type entries.
 */
export function extractSubagentIds(fileContent: string): string[] {
  const ids = new Set<string>();
  for (const line of fileContent.split("\n")) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line);
      if (raw.type !== "user") continue;
      const agentId = raw.toolUseResult?.agentId;
      if (typeof agentId === "string" && /^[a-f0-9]+$/.test(agentId)) {
        ids.add(agentId);
      }
    } catch {
      // skip malformed lines
    }
  }
  return Array.from(ids);
}
