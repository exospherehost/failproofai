import { execSync } from "node:child_process";
const BINARY_PATH = "dist/cli.mjs";
const PROJECT_DIR = "__tests__/fixtures/gemini-project";
try {
  const output = execSync(`bun ${BINARY_PATH} --hook BeforeTool --cli gemini`, {
    input: JSON.stringify({"session_id":"test-session-gemini-bash-001","cwd":"/home/yashu/fp/failproofai/__tests__/fixtures/gemini-project","hook_event_name":"BeforeTool","tool_name":"Shell","tool_input":"ls"}),
    cwd: process.cwd(),
    env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" }
  });
  console.log("STDOUT:", output.toString());
} catch (e) {
  console.log("ERROR:", e.message);
  console.log("STDERR:", e.stderr?.toString());
  console.log("STDOUT:", e.stdout?.toString());
}
