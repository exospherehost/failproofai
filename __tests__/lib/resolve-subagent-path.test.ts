// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join, relative } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveSubagentPath } from "@/lib/resolve-subagent-path";

describe("resolveSubagentPath", () => {
  let fixtureRoot: string;
  let projectsPath: string;

  const projectName = "project";
  const sessionId = "session";
  const agentId = "abc123";

  beforeEach(async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), "failproofai-subagents-"));
    projectsPath = join(fixtureRoot, "projects");
    await mkdir(join(projectsPath, projectName, sessionId, "subagents"), { recursive: true });
  });

  afterEach(async () => {
    await rm(fixtureRoot, { recursive: true, force: true });
  });

  async function touch(path: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "");
  }

  it("returns candidate 1 when the project-level agent log exists", async () => {
    const candidate = join(projectsPath, projectName, `agent-${agentId}.jsonl`);
    await touch(candidate);

    await expect(resolveSubagentPath(projectsPath, projectName, sessionId, agentId)).resolves.toBe(candidate);
  });

  it("returns candidate 2 when candidate 1 is missing", async () => {
    const candidate = join(projectsPath, projectName, sessionId, `agent-${agentId}.jsonl`);
    await touch(candidate);

    await expect(resolveSubagentPath(projectsPath, projectName, sessionId, agentId)).resolves.toBe(candidate);
  });

  it("returns candidate 3 when candidates 1 and 2 are missing", async () => {
    const candidate = join(projectsPath, projectName, sessionId, "subagents", `agent-${agentId}.jsonl`);
    await touch(candidate);

    await expect(resolveSubagentPath(projectsPath, projectName, sessionId, agentId)).resolves.toBe(candidate);
  });

  it("returns candidate 1 when all candidate paths exist", async () => {
    const candidate1 = join(projectsPath, projectName, `agent-${agentId}.jsonl`);
    const candidate2 = join(projectsPath, projectName, sessionId, `agent-${agentId}.jsonl`);
    const candidate3 = join(projectsPath, projectName, sessionId, "subagents", `agent-${agentId}.jsonl`);
    await touch(candidate3);
    await touch(candidate2);
    await touch(candidate1);

    await expect(resolveSubagentPath(projectsPath, projectName, sessionId, agentId)).resolves.toBe(candidate1);
  });

  it("returns null when none of the candidate paths exist", async () => {
    await expect(resolveSubagentPath(projectsPath, projectName, sessionId, agentId)).resolves.toBeNull();
  });

  it("does not resolve an existing candidate outside the projects path", async () => {
    const traversalAgentId = "../../../../escape";
    const escapedCandidate = join(projectsPath, projectName, `agent-${traversalAgentId}.jsonl`);
    expect(relative(projectsPath, escapedCandidate).startsWith("..")).toBe(true);
    expect(relative(fixtureRoot, escapedCandidate).startsWith("..")).toBe(false);
    await touch(escapedCandidate);

    await expect(resolveSubagentPath(projectsPath, projectName, sessionId, traversalAgentId)).resolves.toBeNull();
  });
});
