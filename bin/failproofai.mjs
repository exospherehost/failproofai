#!/usr/bin/env bun
/**
 * failproofai — main entry point.
 *
 * Handles:
 *   --hook <event>   Hook event from Claude Code (minimal startup latency)
 *   --version / -v   Print version and exit
 *   --dev            Launch Next.js in dev mode (hot-reload)
 *   (default)        Launch Next.js in production mode
 */
import { version } from "../package.json";

const args = process.argv.slice(2);

// --version / -v
if (args.includes("--version") || args.includes("-v")) {
  console.log(version);
  process.exit(0);
}

// --hook <event> — called by Claude Code hooks; fast path, no dashboard startup
const hookIdx = args.indexOf("--hook");
if (hookIdx >= 0 && args[hookIdx + 1]) {
  const { handleHookEvent } = await import("../src/hooks/handler");
  const exitCode = await handleHookEvent(args[hookIdx + 1]);
  process.exit(exitCode);
}

// Dashboard launch
const { launch } = await import("../scripts/launch");
const mode = args.includes("--dev") ? "dev" : "start";
launch(mode);
