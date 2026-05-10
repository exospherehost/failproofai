/**
 * Shared launch logic for dev.ts and start.ts.
 */
import { spawn } from "child_process";
import { realpathSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseScriptArgs } from "./parse-script-args";
import { diagnoseShadow } from "./install-diagnosis.mjs";
import { version } from "../package.json";
import { coloredBanner, monoBanner, BANNER_COLS } from "./banner.generated";

export function launch(mode: "dev" | "start"): void {
  const { loggingLevel, disableTelemetry, allowedDevOrigins, remainingArgs } = parseScriptArgs(process.argv.slice(2));

  // Pre-rendered wordmark — see scripts/generate-banner.ts. Two variants of
  // the same logo: coloredBanner uses 24-bit ANSI fg/bg per cell with `▀`
  // half-blocks (each char encodes 2 vertically-stacked source pixels at
  // 1:1 aspect, so the teal flower + pink "l" highlights survive); monoBanner
  // is the same grid in plain Unicode block chars for terminals where 24-bit
  // color is unavailable (NO_COLOR, non-TTY, basic terminals).
  const cols = process.stdout.columns;
  const fitsArt = cols === undefined || cols >= BANNER_COLS + 2;
  // FORCE_COLOR=3 follows the chalk/supports-color convention: explicitly
  // forces 24-bit color even when stdout isn't a TTY (useful for piping
  // colored output into a pager or capturing for sharing).
  const forceTruecolor = process.env.FORCE_COLOR === "3";
  const noColor =
    process.env.NO_COLOR !== undefined
    || process.env.FORCE_COLOR === "0"
    || (!process.stdout.isTTY && !forceTruecolor);
  // Most modern terminals (iTerm2, kitty, alacritty, Windows Terminal,
  // gnome-terminal, vscode, wezterm) advertise 24-bit support via
  // COLORTERM=truecolor. When COLORTERM isn't set we'd rather emit clean
  // monochrome blocks than risk garbled escapes on a basic terminal.
  const supports24bit =
    !noColor
    && (process.env.COLORTERM === "truecolor"
      || process.env.COLORTERM === "24bit"
      || forceTruecolor);
  let banner: string;
  if (!fitsArt) {
    banner = "  failproof ai";
  } else if (supports24bit) {
    banner = "  " + coloredBanner.join("\n  ");
  } else {
    banner = "  " + monoBanner.join("\n  ");
  }
  console.log(`\n${banner}\n\n  v${version}\n`);
  console.log(`  ⭐ Star us:      https://github.com/exospherehost/failproofai`);
  console.log(`  📖 Docs:         https://befailproof.ai`);
  console.log(`  💬 Slack:        https://join.slack.com/t/failproofai/shared_invite/zt-3v63b7k5e-O3NBHmj8X6n9gZSGDx6ggQ\n`);

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
      // Most "missing server.js" reports come from a PATH shadow (an older
      // `bun link` or a `bun install -g` whose prefix wins over npm), not from
      // a genuinely broken build. Diagnose first so the error message names
      // the actual cause when that's what's going on.
      let shadowMessage: string | null = null;
      try {
        const diag = diagnoseShadow({ selfPackageRoot: packageRoot, selfVersion: version });
        if (diag.shadowed) {
          // Pick whichever alternate install exists at npm/bun globals AND
          // differs from PATH-first. In the runtime stale-binary scenario the
          // running install IS the PATH-first one, so we'd otherwise point the
          // user back at themselves.
          const alt =
            (diag.npmGlobalPath && diag.npmGlobalPath !== diag.pathFirstPath
              ? { path: diag.npmGlobalPath, version: diag.npmGlobalVersion }
              : null)
            ?? (diag.bunGlobalPath && diag.bunGlobalPath !== diag.pathFirstPath
              ? { path: diag.bunGlobalPath, version: diag.bunGlobalVersion }
              : null);
          const newer = alt?.path ?? "(unknown)";
          const newerVer = alt?.version ?? "?";
          shadowMessage =
            `\nError: failproofai on your PATH is a stale install that no longer has its build output.\n` +
            `  Running:    ${diag.pathFirstPath}` + (diag.pathFirstVersion ? `  (v${diag.pathFirstVersion})` : "") + `\n` +
            `  Newer copy: ${newer}  (v${newerVer})\n\n` +
            `Remove the shadow with:\n  ${diag.recommendation}\n`;
        }
      } catch {
        // Diagnosis is best-effort; fall back to the original message.
      }
      console.error(
        shadowMessage ??
        `\nError: Cannot find server.js at:\n  ${serverJsPath}\n\n` +
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
