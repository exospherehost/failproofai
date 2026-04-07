#!/usr/bin/env bun
/**
 * failproofai — main entry point.
 *
 * Handles:
 *   --hook <event>        Hook event from Claude Code (minimal startup latency)
 *   --version / -v        Print version and exit
 *   --help / -h           Show usage and exit
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

// --help / -h
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
failproofai v${version}

USAGE
  failproofai [command] [options]

COMMANDS
  (no args)                      Launch the policy dashboard

  --install-policies [names...]  Enable policies in Claude Code settings
    --scope user|project|local     Config scope to write to (default: user)
    --beta                         Include beta policies
    --custom <path>                Path to a JS file of custom policies

  --remove-policies [names...]   Disable policies or remove hooks
    --scope user|project|local|all Config scope to remove from (default: user)
    --beta                         Remove only beta policies
    --custom                       Clear the customPoliciesPath from config

  --list-policies                List all available policies and their status

  --version, -v                  Print version and exit
  --help, -h                     Show this help message

EXAMPLES
  failproofai --install-policies
  failproofai --install-policies block-sudo sanitize-api-keys --scope project
  failproofai --install-policies --custom ./my-policies.js
  failproofai --remove-policies block-sudo
  failproofai --remove-policies --custom
  failproofai --list-policies
`.trimStart());
  process.exit(0);
}

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

// --install-policies [policyNames...] [--scope user|project|local] [--beta] [--custom <path>]
if (args.includes("--install-policies")) {
  const { installHooks } = await import("../src/hooks/manager");

  const scopeIdx = args.indexOf("--scope");
  const scope = scopeIdx >= 0 ? args[scopeIdx + 1] : "user";

  const customIdx = args.indexOf("--custom");
  const customPoliciesPath = customIdx >= 0 ? args[customIdx + 1] : undefined;

  const includeBeta = args.includes("--beta");

  // Collect positional policy names (args after --install-policies that don't start with --)
  const installIdx = args.indexOf("--install-policies");
  const policyNames = args
    .slice(installIdx + 1)
    .filter((a) => !a.startsWith("--") && a !== scope && a !== customPoliciesPath);

  await installHooks(
    policyNames.length > 0 ? policyNames : undefined,
    scope,
    undefined,
    includeBeta,
    undefined,
    customPoliciesPath,
  );
  process.exit(0);
}

// --remove-policies [policyNames...] [--scope user|project|local|all] [--beta] [--custom]
if (args.includes("--remove-policies")) {
  const { removeHooks } = await import("../src/hooks/manager");

  const scopeIdx = args.indexOf("--scope");
  const scope = scopeIdx >= 0 ? args[scopeIdx + 1] : "user";

  const betaOnly = args.includes("--beta");
  const removeCustomHooks = args.includes("--custom");

  const removeIdx = args.indexOf("--remove-policies");
  const policyNames = args
    .slice(removeIdx + 1)
    .filter((a) => !a.startsWith("--") && a !== scope);

  await removeHooks(
    policyNames.length > 0 ? policyNames : undefined,
    scope,
    undefined,
    { betaOnly, removeCustomHooks },
  );
  process.exit(0);
}

// --list-policies
if (args.includes("--list-policies")) {
  const { listHooks } = await import("../src/hooks/manager");
  await listHooks();
  process.exit(0);
}

// Unknown flag guard — must appear after all known-flag branches
const knownFlags = ["--version", "-v", "--help", "-h", "--hook",
                    "--install-policies", "--remove-policies", "--list-policies",
                    "--scope", "--beta", "--custom"];
const unknownFlag = args.find(a => a.startsWith("-") && !knownFlags.includes(a));

if (unknownFlag) {
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  }

  const primary = ["--version", "--help", "--hook", "--install-policies",
                   "--remove-policies", "--list-policies"];
  const closest = primary.reduce((best, flag) => {
    const dist = levenshtein(unknownFlag, flag);
    return dist < best.dist ? { flag, dist } : best;
  }, { flag: primary[0], dist: Infinity });

  console.error(`Unknown flag: ${unknownFlag}`);
  console.error(`Did you mean: ${closest.flag}?`);
  console.error(`Run \`failproofai --help\` for usage details.`);
  process.exit(1);
}

// Dashboard launch — always production mode
const { launch } = await import("../scripts/launch");
launch("start");
