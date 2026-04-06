#!/usr/bin/env bun
/**
 * failproofai — main entry point.
 *
 * Handles:
 *   --hook <event>        Hook event from Claude Code (minimal startup latency)
 *   --version / -v        Print version and exit
 *   --install-policies    Install hooks + enable policies in Claude Code settings
 *   --remove-policies     Remove hooks or disable policies from Claude Code settings
 *   --list-policies       List available policies and their status
 *   (default)             Launch production dashboard
 */
import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { version } from "../package.json";

// Resolve the real package root early (following any npm bin symlinks) so that
// scripts/launch.ts can locate .next/standalone/server.js correctly regardless
// of how bun resolves import.meta.url for dynamically-imported modules.
if (!process.env.FAILPROOFAI_PACKAGE_ROOT) {
  process.env.FAILPROOFAI_PACKAGE_ROOT = resolve(
    dirname(realpathSync(fileURLToPath(import.meta.url))),
    ".."
  );
}

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

// --install-policies [policyNames...] [--scope user|project|local] [--beta] [--custom-hooks <path>] [--remove-custom-hooks]
if (args.includes("--install-policies")) {
  const { installHooks } = await import("../src/hooks/manager");

  const scopeIdx = args.indexOf("--scope");
  const scope = scopeIdx >= 0 ? args[scopeIdx + 1] : "user";

  const customHooksIdx = args.indexOf("--custom-hooks");
  const customHooksPath = customHooksIdx >= 0 ? args[customHooksIdx + 1] : undefined;

  const includeBeta = args.includes("--beta");
  const removeCustomHooks = args.includes("--remove-custom-hooks");

  // Collect positional policy names (args after --install-policies that don't start with --)
  const installIdx = args.indexOf("--install-policies");
  const policyNames = args
    .slice(installIdx + 1)
    .filter((a) => !a.startsWith("--") && a !== scope && a !== customHooksPath);

  await installHooks(
    policyNames.length > 0 ? policyNames : undefined,
    scope,
    undefined,
    includeBeta,
    undefined,
    customHooksPath,
    removeCustomHooks,
  );
  process.exit(0);
}

// --remove-policies [policyNames...] [--scope user|project|local|all] [--beta-only]
if (args.includes("--remove-policies")) {
  const { removeHooks } = await import("../src/hooks/manager");

  const scopeIdx = args.indexOf("--scope");
  const scope = scopeIdx >= 0 ? args[scopeIdx + 1] : "user";

  const betaOnly = args.includes("--beta-only");

  const removeIdx = args.indexOf("--remove-policies");
  const policyNames = args
    .slice(removeIdx + 1)
    .filter((a) => !a.startsWith("--") && a !== scope);

  await removeHooks(
    policyNames.length > 0 ? policyNames : undefined,
    scope,
    undefined,
    { betaOnly },
  );
  process.exit(0);
}

// --list-policies
if (args.includes("--list-policies")) {
  const { listHooks } = await import("../src/hooks/manager");
  await listHooks();
  process.exit(0);
}

// Dashboard launch — always production mode
const { launch } = await import("../scripts/launch");
launch("start");
