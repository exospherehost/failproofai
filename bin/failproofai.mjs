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

// Unknown flag guard — must appear after all known-flag branches
const knownFlags = ["--version", "-v", "--hook", "--install-policies",
                    "--remove-policies", "--list-policies"];
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

  const primary = ["--version", "--hook", "--install-policies",
                   "--remove-policies", "--list-policies"];
  const closest = primary.reduce((best, flag) => {
    const dist = levenshtein(unknownFlag, flag);
    return dist < best.dist ? { flag, dist } : best;
  }, { flag: primary[0], dist: Infinity });

  console.error(`Unknown flag: ${unknownFlag}`);
  console.error(`Did you mean: ${closest.flag}?`);
  process.exit(1);
}

// Dashboard launch — always production mode
const { launch } = await import("../scripts/launch");
launch("start");
