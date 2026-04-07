/**
 * Shared launch logic for dev.ts and start.ts.
 */
import { getDefaultClaudeProjectsPath } from "../lib/paths";
import { spawn } from "child_process";
import { realpathSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseScriptArgs } from "./parse-script-args";
import { version } from "../package.json";

export function launch(mode: "dev" | "start"): void {
  const { claudeProjectsPath: parsedPath, loggingLevel, disableTelemetry, allowedDevOrigins, remainingArgs } = parseScriptArgs(process.argv.slice(2));

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

  let cmd: string;
  let cmdArgs: string[];
  if (mode === "start") {
    const portIdx = remainingArgs.indexOf("--port");
    const port = portIdx >= 0 ? remainingArgs[portIdx + 1] : "8020";
    process.env.PORT = port;
    process.env.HOSTNAME = "0.0.0.0";
    cmd = "node";
    // Resolve the real package root via realpathSync so symlinked npm global binaries
    // don't cause import.meta.url to point at the symlink dir instead of the package dir.
    const packageRoot = process.env.FAILPROOFAI_PACKAGE_ROOT
      ?? resolve(dirname(realpathSync(fileURLToPath(import.meta.url))), "..");
    const serverJsPath = resolve(packageRoot, ".next/standalone/server.js");
    if (!existsSync(serverJsPath)) {
      console.error(
        `\nError: Cannot find server binary at:\n  ${serverJsPath}\n\n` +
        `The package may be missing its build output.\n` +
        `Try reinstalling:\n  npm install -g failproofai@latest\n`
      );
      process.exit(1);
    }
    cmdArgs = [serverJsPath];
  } else {
    cmd = "bunx";
    cmdArgs = ["--bun", "next", "dev", ...remainingArgs];
  }

  const nextProcess = spawn(cmd, cmdArgs, {
    stdio: "inherit",
    env: {
      ...process.env,
      CLAUDE_PROJECTS_PATH: claudeProjectsPath,
      ...(loggingLevel ? { FAILPROOFAI_LOG_LEVEL: loggingLevel } : {}),
      ...(disableTelemetry ? { FAILPROOFAI_TELEMETRY_DISABLED: "1" } : {}),
      ...(allowedDevOrigins ? { FAILPROOFAI_ALLOWED_DEV_ORIGINS: allowedDevOrigins.join(",") } : {}),
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
