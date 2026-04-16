#!/usr/bin/env bun
/**
 * failproofai — main entry point.
 *
 * Handles:
 *   --hook <event>        Hook event from Claude Code (minimal startup latency)
 *   --version / -v        Print version and exit
 *   --help / -h           Show usage and exit
 *   policies              Manage policies (list / install / uninstall)
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

if (!process.env.FAILPROOFAI_DIST_PATH) {
  process.env.FAILPROOFAI_DIST_PATH = resolve(
    dirname(realpathSync(fileURLToPath(import.meta.url))),
    "..",
    "dist"
  );
}

const args = process.argv.slice(2);

// Normalize 'p' → 'policies' (shorthand alias)
if (args[0] === "p") args[0] = "policies";

// copilot-sync — lightweight command run from ~/.bashrc on every terminal open.
// Re-creates the snap revision symlink (rev/hooks/ → common/hooks/) if missing,
// so that snap updates don't silently break Copilot hook delivery.
if (args[0] === "copilot-sync") {
  try {
    const { ensureCopilotRevisionSymlink } = await import("../src/hooks/integrations");
    ensureCopilotRevisionSymlink?.();
  } catch {
    // Silenced — the 2>/dev/null in .bashrc handles stderr, but be safe
  }
  process.exit(0);
}

// --hook <event> — called by Claude Code hooks; fast path, outside runCli()
// because it has its own exit code contract with Claude Code.
const hookIdx = args.indexOf("--hook");
if (hookIdx >= 0) {
  if (!args[hookIdx + 1]) {
    console.error("Error: Missing event type after --hook");
    console.error("Usage: failproofai --hook <event>  (e.g. PreToolUse, PostToolUse)");
    process.exit(1);
  }

  // 1. Global Hook Deduplication
  // Prevents multiple hooks (e.g. user + project) from executing in the same process tree.
  const hookKey = `FAILPROOFAI_HOOK_ACTIVE_${args[hookIdx + 1]}`;
  if (process.env[hookKey]) {
    process.exit(0);
  }
  process.env[hookKey] = "true";

  try {
    const integrationIdx = args.indexOf("--integration");
    const integrationOverride = integrationIdx >= 0 ? args[integrationIdx + 1] : undefined;
    const { handleHookEvent } = await import("../src/hooks/handler");
    const exitCode = await handleHookEvent(args[hookIdx + 1], integrationOverride);
    process.exit(exitCode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Unexpected error: ${msg}`);
    process.exit(2);
  }
}

// --relay-daemon — internal: long-running background process started by
// ensureRelayRunning(). Streams queued events to the server via WebSocket.
if (args.includes("--relay-daemon")) {
  try {
    const { runDaemon } = await import("../src/relay/daemon");
    await runDaemon();
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Relay daemon error: ${msg}`);
    process.exit(1);
  }
}

/**
 * Centralised error handler for all CLI subcommands.
 * CliError  → clean message, no stack trace, exit exitCode (1 or 2)
 * Error     → unexpected; shows message only, exits 2
 */
async function runCli() {
  // --help / -h  (only when not inside a subcommand that handles its own --help)
  const SUBCOMMANDS = ["policies", "login", "logout", "whoami", "relay", "sync"];
  if ((args.includes("--help") || args.includes("-h")) && !SUBCOMMANDS.includes(args[0])) {
    const extraArgs = args.filter((a) => a !== "--help" && a !== "-h");
    if (extraArgs.length > 0) {
      throw new CliError(`Unexpected argument: ${extraArgs[0]}\nRun \`failproofai --help\` for usage.`);
    }
    console.log(`
failproofai v${version}

USAGE
  failproofai [command] [options]

COMMANDS
  (no args)                      Launch the policy dashboard

  policies, p                    List all available policies and their status
  policies --install, -i         Enable policies in Claude Code settings
    [names...]                     Specific policy names to enable
    --scope user|project|local     Config scope to write to (default: user)
    --beta                         Include beta policies
    --custom, -c <path>            Path to a JS file of custom policies

  policies --uninstall, -u       Disable policies or remove hooks
    [names...]                     Specific policy names to disable
    --scope user|project|local|all Config scope to remove from (default: user)
    --beta                         Remove only beta policies
    --custom, -c                   Clear the customPoliciesPath from config

  --integration claude-code|cursor|gemini|copilot|codex  Target platform (default: claude-code)

  policies --help, -h            Show this help for the policies command

  login                          Authenticate with the failproofai cloud (Google OAuth)
  logout                         Clear local auth tokens and stop relay daemon
  whoami                         Print current logged-in user
  relay start|stop|status        Manage the event relay daemon
  sync                           One-shot flush of pending events to the server

  --version, -v                  Print version and exit
  --help, -h                     Show this help message

CONVENTION POLICIES
  Drop *policies.{js,mjs,ts} files into .failproofai/policies/ for auto-loading.
  Works at project level (.failproofai/policies/) and user level (~/.failproofai/policies/).
  No --custom flag or config changes needed — just drop files and they're picked up.

EXAMPLES
  failproofai policies
  failproofai policies --install
  failproofai policies --install block-sudo sanitize-api-keys --scope project
  failproofai policies --install --custom ./my-policies.js
  failproofai policies -i -c ./my-policies.js
  failproofai policies --uninstall block-sudo
  failproofai policies --uninstall --custom
  failproofai policies --install --integration cursor
  failproofai policies --integration cursor

LINKS
  ⭐ Star us:      https://github.com/exospherehost/failproofai
  📖 Docs:         https://befailproof.ai
`.trimStart());
    process.exit(0);
  }

  // --version / -v
  if ((args.includes("--version") || args.includes("-v")) && !SUBCOMMANDS.includes(args[0])) {
    const extraArgs = args.filter((a) => a !== "--version" && a !== "-v");
    if (extraArgs.length > 0) {
      throw new CliError(`Unexpected argument: ${extraArgs[0]}\nRun \`failproofai --help\` for usage.`);
    }
    console.log(version);
    process.exit(0);
  }

  // policies [--install|-i|--uninstall|-u|--help|-h] [names...] [--scope] [--beta] [--custom|-c <path>]
  if (args[0] === "policies") {
    const subArgs = args.slice(1);

    const isInstall   = subArgs.includes("--install")   || subArgs.includes("-i");
    const isUninstall = subArgs.includes("--uninstall")  || subArgs.includes("-u");
    const isHelp      = subArgs.includes("--help")       || subArgs.includes("-h");

    // Parse --integration flag (shared across install/uninstall/list)
    const integrationIdx = subArgs.indexOf("--integration");
    const integrationArg = integrationIdx >= 0 ? subArgs[integrationIdx + 1] : "claude-code";
    if (integrationIdx >= 0 && (!integrationArg || integrationArg.startsWith("-"))) {
      const { INTEGRATION_TYPES } = await import("../src/hooks/types");
      throw new CliError(`Missing value for --integration. Valid values: ${INTEGRATION_TYPES.join(", ")}`);
    }
    const { INTEGRATION_TYPES } = await import("../src/hooks/types");
    if (integrationIdx >= 0 && !INTEGRATION_TYPES.includes(integrationArg)) {
      throw new CliError(`Invalid integration: ${integrationArg}. Valid values: ${INTEGRATION_TYPES.join(", ")}`);
    }

    if (isHelp) {
      console.log(`
failproofai policies — manage Failproof AI policies

USAGE
  failproofai policies                       List all policies and their status
  failproofai policies --install, -i         Enable policies
  failproofai policies --uninstall, -u       Disable policies or remove hooks

OPTIONS (shared)
  --integration claude-code|cursor|gemini|copilot|codex  Target platform (default: claude-code)

OPTIONS (install)
  [names...]                     Specific policy names to enable (omit for interactive)
  --scope <scope>                Config scope to write to (default: user)
    Claude Code scopes:  user | project | local
    Cursor scopes:       user | project
  --beta                         Include beta policies
  --custom, -c <path>            Path to a JS file of custom policies
                                 (skips interactive prompt; validates file first)

OPTIONS (uninstall)
  [names...]                     Specific policy names to disable (omit to remove hooks)
  --scope <scope>|all            Config scope to remove from (default: user)
  --beta                         Remove only beta policies
  --custom, -c                   Clear the customPoliciesPath from config

EXAMPLES
  failproofai policies
  failproofai policies --install
  failproofai policies --install block-sudo sanitize-api-keys
  failproofai policies --install --custom ./my-policies.js
  failproofai policies -i -c ./my-policies.js
  failproofai policies --uninstall block-sudo
  failproofai policies -u
  failproofai policies --uninstall --custom

  # Cursor integration
  failproofai policies --install --integration cursor
  failproofai policies --uninstall --integration cursor --scope project
  failproofai policies --integration cursor
`.trimStart());
      process.exit(0);
    }

    if (isInstall) {
      const { installHooks } = await import("../src/hooks/manager");
      const { getIntegration } = await import("../src/hooks/integrations");
      const integ = getIntegration(integrationArg);
      const validScopes = [...integ.scopes];

      const scopeIdx = subArgs.indexOf("--scope");
      const scope = scopeIdx >= 0 ? subArgs[scopeIdx + 1] : "user";
      if (scopeIdx >= 0 && (!scope || scope.startsWith("-"))) {
        throw new CliError(`Missing value for --scope. Valid values: ${validScopes.join(", ")}`);
      }
      if (scopeIdx >= 0 && !validScopes.includes(scope)) {
        throw new CliError(`Invalid scope: ${scope}. Valid values for ${integ.displayName}: ${validScopes.join(", ")}`);
      }

      const customIdx = subArgs.includes("--custom") ? subArgs.indexOf("--custom")
                      : subArgs.includes("-c")        ? subArgs.indexOf("-c")
                      : -1;
      const customPoliciesPath = customIdx >= 0 ? subArgs[customIdx + 1] : undefined;
      if (customIdx >= 0 && (!customPoliciesPath || customPoliciesPath.startsWith("-"))) {
        throw new CliError("Missing path after --custom/-c\nUsage: --custom <path>  (e.g. --custom ./my-policies.js)");
      }

      const includeBeta = subArgs.includes("--beta");

      // Collect positional policy names — args that don't start with - and aren't
      // values consumed by --scope, --custom/-c, or --integration (tracked by index,
      // not value, so a policy named "user" isn't incorrectly dropped).
      const consumedIdxs = new Set();
      if (scopeIdx >= 0) consumedIdxs.add(scopeIdx + 1);
      if (customIdx >= 0) consumedIdxs.add(customIdx + 1);
      if (integrationIdx >= 0) consumedIdxs.add(integrationIdx + 1);
      const flags = new Set(["--install", "-i", "--scope", "--beta", "--custom", "-c", "--integration"]);
      const unknownInstallFlag = subArgs.find((a) => a.startsWith("-") && !flags.has(a));
      if (unknownInstallFlag) {
        throw new CliError(`Unknown flag: ${unknownInstallFlag}\nRun \`failproofai policies --help\` for usage.`);
      }

      const explicitPolicyNames = subArgs.filter(
        (a, idx) => !a.startsWith("-") && !consumedIdxs.has(idx)
      );

      // When --custom/-c is present but no explicit policy names, pass [] so
      // installHooks uses the existing enabled policies and skips the interactive
      // prompt — validation of the custom file happens inside installHooks.
      const policyNames =
        explicitPolicyNames.length > 0 ? explicitPolicyNames
        : customPoliciesPath !== undefined ? []
        : undefined;

      await installHooks(
        policyNames,
        scope,
        undefined,
        includeBeta,
        undefined,
        customPoliciesPath,
        false,
        integrationArg,
      );
      process.exit(0);
    }

    if (isUninstall) {
      const { removeHooks } = await import("../src/hooks/manager");
      const { getIntegration } = await import("../src/hooks/integrations");
      const integ = getIntegration(integrationArg);
      const validScopes = [...integ.scopes, "all"];

      const scopeIdx = subArgs.indexOf("--scope");
      const scope = scopeIdx >= 0 ? subArgs[scopeIdx + 1] : "user";
      if (scopeIdx >= 0 && (!scope || scope.startsWith("-"))) {
        throw new CliError(`Missing value for --scope. Valid values: ${validScopes.join(", ")}`);
      }
      if (scopeIdx >= 0 && !validScopes.includes(scope)) {
        throw new CliError(`Invalid scope: ${scope}. Valid values for ${integ.displayName}: ${validScopes.join(", ")}`);
      }

      const betaOnly = subArgs.includes("--beta");
      const removeCustomHooks = subArgs.includes("--custom") || subArgs.includes("-c");

      const consumedIdxs = new Set();
      if (scopeIdx >= 0) consumedIdxs.add(scopeIdx + 1);
      if (integrationIdx >= 0) consumedIdxs.add(integrationIdx + 1);
      const flags = new Set(["--uninstall", "-u", "--scope", "--beta", "--custom", "-c", "--integration"]);
      const unknownUninstallFlag = subArgs.find((a) => a.startsWith("-") && !flags.has(a));
      if (unknownUninstallFlag) {
        throw new CliError(`Unknown flag: ${unknownUninstallFlag}\nRun \`failproofai policies --help\` for usage.`);
      }

      const policyNames = subArgs.filter(
        (a, idx) => !a.startsWith("-") && !consumedIdxs.has(idx)
      );

      await removeHooks(
        policyNames.length > 0 ? policyNames : undefined,
        scope,
        undefined,
        { betaOnly, removeCustomHooks, integration: integrationArg },
      );
      process.exit(0);
    }

    // Default: list policies
    // Accept --list as a no-op alias (common intuition), reject all other unknown flags
    // and unexpected positional args (e.g. "hi").
    const knownListFlags = new Set(["--install", "-i", "--uninstall", "-u", "--help", "-h", "--list", "--integration", "--scope"]);
    const unknownListArg = subArgs.find((a) => a.startsWith("-") && !knownListFlags.has(a));
    if (unknownListArg) {
      throw new CliError(
        `Unknown flag: ${unknownListArg}\n` +
        `Run \`failproofai policies --help\` for usage.`
      );
    }
    const listConsumedIdxs = new Set();
    if (integrationIdx >= 0) listConsumedIdxs.add(integrationIdx + 1);
    const positionalArgs = subArgs.filter((a, idx) => !a.startsWith("-") && !listConsumedIdxs.has(idx));
    if (positionalArgs.length > 0) {
      throw new CliError(
        `Unexpected argument: ${positionalArgs[0]}\n` +
        `Run \`failproofai policies --help\` for usage.`
      );
    }

    const { listHooks } = await import("../src/hooks/manager");
    await listHooks(undefined, integrationArg);
    process.exit(0);
  }

  // login — authenticate with failproofai server via Google OAuth
  if (args[0] === "login") {
    const { login } = await import("../src/auth/login");
    await login();
    process.exit(0);
  }

  // logout — clear local tokens and stop relay daemon
  if (args[0] === "logout") {
    const { logout } = await import("../src/auth/logout");
    await logout();
    process.exit(0);
  }

  // whoami — print current user and auth status
  if (args[0] === "whoami") {
    const { whoami } = await import("../src/auth/logout");
    whoami();
    process.exit(0);
  }

  // relay start|stop|status — manage the event relay daemon
  if (args[0] === "relay") {
    const subcmd = args[1];
    const { relayStatus, stopRelay } = await import("../src/relay/pid");

    if (subcmd === "status") {
      const s = relayStatus();
      if (s.running) console.log(`Relay daemon running (pid ${s.pid})`);
      else if (s.pid !== null) console.log(`Stale PID file (${s.pid}); daemon not running`);
      else console.log("Relay daemon not running");
      process.exit(0);
    }

    if (subcmd === "stop") {
      const stopped = stopRelay();
      console.log(stopped ? "Relay daemon stopped" : "Relay daemon was not running");
      process.exit(0);
    }

    if (subcmd === "start") {
      const { ensureRelayRunning, waitForRelayAlive } = await import("../src/relay/daemon");
      ensureRelayRunning();
      // Spawn is async — give the child a moment to write its PID file
      const alive = await waitForRelayAlive();
      const s = relayStatus();
      if (alive && s.running) {
        console.log(`Relay daemon started (pid ${s.pid})`);
        process.exit(0);
      }
      console.log("Failed to start daemon");
      process.exit(1);
    }

    throw new CliError(
      `Usage: failproofai relay <start|stop|status>`
    );
  }

  // sync — one-shot flush of pending events to server (fallback for no daemon)
  if (args[0] === "sync") {
    const { runOneShotSync } = await import("../src/relay/daemon");
    const count = await runOneShotSync();
    console.log(`Synced ${count} event${count === 1 ? "" : "s"} to server`);
    process.exit(0);
  }

  // Unknown flag guard — must appear after all known-flag branches
  const knownFlags = ["--version", "-v", "--help", "-h", "--hook"];
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

    const primary = ["--version", "--help", "--hook", "policies", "login", "logout", "whoami", "relay", "sync"];
    const closest = primary.reduce((best, flag) => {
      const dist = levenshtein(unknownFlag, flag);
      return dist < best.dist ? { flag, dist } : best;
    }, { flag: primary[0], dist: Infinity });

    throw new CliError(
      `Unknown flag: ${unknownFlag}\n` +
      `Did you mean: ${closest.flag}?\n` +
      `Run \`failproofai --help\` for usage details.`
    );
  }

  // Unknown subcommand guard (non-flag args that aren't a known subcommand)
  const unknownSubcommand = args.find(a => !a.startsWith("-") && !SUBCOMMANDS.includes(a));
  if (unknownSubcommand) {
    throw new CliError(
      `Unknown command: ${unknownSubcommand}\n` +
      `Did you mean: failproofai policies?\n` +
      `Run \`failproofai --help\` for usage details.`
    );
  }

  // Dashboard launch — always production mode
  const { launch } = await import("../scripts/launch");
  launch("start");
}

// ── Emergency Reset (Hygiene) ────────────────────────────────────────────────
/**
 * Resets terminal state: disables mouse tracking and shows cursor.
 * Ensures the shell isn't left in a corrupted state after a TUI exit.
 */
function emergencyReset() {
  // \x1b[?1000l: disable normal mouse reporting
  // \x1b[?1002l: disable button event mouse reporting
  // \x1b[?1003l: disable any event mouse reporting
  // \x1b[?1005l: disable UTF-8 mouse reporting
  // \x1b[?1006l: disable SGR mouse mode
  // \x1b[?1049l: switch to normal screen buffer
  // \x1b[?25h:   show cursor
  process.stdout.write("\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1005l\x1b[?1006l\x1b[?1049l\x1b[?25h");
  if (process.stdin.isTTY && process.stdin.setRawMode) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      // Silenced
    }
  }
}

// Register signals for clean exit
process.on("SIGINT", () => {
  emergencyReset();
  process.exit(130); // Standard for SIGINT
});
process.on("SIGTERM", () => {
  emergencyReset();
  process.exit(143); // Standard for SIGTERM
});

// ── Import CliError for use in the guard above ────────────────────────────────
const { CliError } = await import("../src/cli-error");

// ── Run ───────────────────────────────────────────────────────────────────────
try {
  await runCli();
} catch (err) {
  if (err instanceof CliError) {
    console.error(`Error: ${err.message}`);
    process.exit(err.exitCode);
  }
  // Unexpected internal error — show message only, no stack trace
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Unexpected error: ${msg}`);
  process.exit(2);
} finally {
  emergencyReset();
}
