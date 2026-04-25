import { execSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
const BINARY_PATH = "/home/yashu/fp/failproofai/dist/cli.mjs";
const PROJECT_DIR = "/home/yashu/fp/failproofai/__tests__/fixtures/gemini-project-debug";
if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
mkdirSync(PROJECT_DIR, { recursive: true });

try {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: "/home/yashu/fp/failproofai" }
    });

    const output = execSync(`bun ${BINARY_PATH} --hook BeforeTool --cli gemini`, {
      input: JSON.stringify({"session_id":"test-session-gemini-bash-001","cwd":PROJECT_DIR,"hook_event_name":"BeforeTool","tool_name":"Shell","tool_input":"ls"}),
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: "/home/yashu/fp/failproofai", FAILPROOFAI_SKIP_KILL: "true" }
    }).toString();
    console.log("STDOUT:", output);
} catch (e) {
  console.log("ERROR:", e.message);
  console.log("STDERR:", e.stderr?.toString());
  console.log("STDOUT:", e.stdout?.toString());
}
