/**
 * Shared launch logic for dev.ts and start.ts.
 */
import { getDefaultClaudeProjectsPath } from "../lib/paths";
import { spawn } from "child_process";
import { parseScriptArgs } from "./parse-script-args";
import { version } from "../package.json";

export function launch(mode: "dev" | "start"): void {
  const { claudeProjectsPath: parsedPath, loggingLevel, disableTelemetry, remainingArgs } = parseScriptArgs(process.argv.slice(2));

  console.log(`
    ______      _ __                       ____   ___    ____
   / ____/___ _(_) /___  _________  ____  / __/  /   |  /  _/
  / /_  / __ \`/ / / __ \\/ ___/ __ \\/ __ \\/ /_   / /| |  / /
 / __/ / /_/ / / / /_/ / /  / /_/ / /_/ / __/  / ___ |_/ /
/_/    \\__,_/_/_/ .___/_/   \\____/\\____/_/    /_/  |_/___/
               /_/   v${version}
`);

  let claudeProjectsPath = parsedPath;

  if (!claudeProjectsPath) {
    claudeProjectsPath = getDefaultClaudeProjectsPath();
    console.log(`Using default .claude projects path: ${claudeProjectsPath}`);
  } else {
    console.log(`Using custom .claude projects path: ${claudeProjectsPath}`);
  }

  process.env.CLAUDE_PROJECTS_PATH = claudeProjectsPath;

  const nextProcess = spawn("bunx", ["--bun", "next", mode, ...remainingArgs], {
    stdio: "inherit",
    env: {
      ...process.env,
      CLAUDE_PROJECTS_PATH: claudeProjectsPath,
      ...(loggingLevel ? { FAILPROOFAI_LOG_LEVEL: loggingLevel } : {}),
      ...(disableTelemetry ? { FAILPROOFAI_TELEMETRY_DISABLED: "1" } : {}),
    },
  });

  nextProcess.on("error", (error) => {
    console.error("Error starting Next.js:", error);
    process.exit(1);
  });

  nextProcess.on("exit", (code) => {
    process.exit(code || 0);
  });
}
