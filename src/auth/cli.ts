/**
 * `failproofai auth` CLI surface.
 *
 *   failproofai auth --login    Email + OTP flow; writes ~/.failproofai/auth.json
 *   failproofai auth --logout   Revoke the session and wipe auth.json
 *   failproofai auth --whoami   Print the currently logged-in identity (or "not authed")
 *   failproofai auth --help     Usage
 *
 * The implementation deliberately avoids new external deps — readline + stdin
 * + ANSI escapes are enough for a one-shot prompt loop.
 */

import * as readline from "node:readline";

import {
  AuthApiError,
  getApiBase,
  logoutSession,
  requestLoginCode,
  verifyLoginCode,
} from "../../lib/auth/api-server-client";
import {
  authFromTokenResponse,
  deleteAuth,
  readAuth,
  whoAmI,
  writeAuth,
} from "../../lib/auth/auth-store";
import { CliError } from "../cli-error";

interface AuthCliOptions {
  mode: "login" | "logout" | "whoami" | "help";
}

const HELP = `
failproofai auth — sign in to FailproofAI from the CLI

USAGE
  failproofai auth --login       Start the email + OTP login flow
  failproofai auth --logout      Revoke this session and remove ~/.failproofai/auth.json
  failproofai auth --whoami      Print the currently authenticated identity
  failproofai auth --help, -h    Show this help

ENVIRONMENT
  FAILPROOF_API_URL              Override the api-server base URL
                                 (default: http://localhost:8080)
  FAILPROOFAI_AUTH_DIR           Override where auth.json is stored
                                 (default: ~/.failproofai)

EXAMPLES
  failproofai auth --login
  failproofai auth --whoami
  failproofai auth --logout
`.trimStart();

export function parseAuthArgs(args: string[]): AuthCliOptions {
  const flags = new Set(args);
  const isHelp = flags.has("--help") || flags.has("-h");
  const isLogin = flags.has("--login");
  const isLogout = flags.has("--logout");
  const isWhoami = flags.has("--whoami");

  if (isHelp) return { mode: "help" };

  const known = new Set(["--login", "--logout", "--whoami", "--help", "-h"]);
  const unknown = args.find((a) => a.startsWith("-") && !known.has(a));
  if (unknown) {
    throw new CliError(
      `Unknown flag for auth: ${unknown}\nRun \`failproofai auth --help\` for usage.`,
    );
  }
  const positional = args.filter((a) => !a.startsWith("-"));
  if (positional.length > 0) {
    throw new CliError(
      `Unexpected argument: ${positional[0]}\nRun \`failproofai auth --help\` for usage.`,
    );
  }

  const count = (isLogin ? 1 : 0) + (isLogout ? 1 : 0) + (isWhoami ? 1 : 0);
  if (count === 0) return { mode: "help" };
  if (count > 1) {
    throw new CliError(
      `Pick one of --login, --logout, --whoami.\nRun \`failproofai auth --help\` for usage.`,
    );
  }
  if (isLogin) return { mode: "login" };
  if (isLogout) return { mode: "logout" };
  return { mode: "whoami" };
}

function prompt(question: string, opts: { hidden?: boolean } = {}): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // Input-masking only makes sense on a real terminal; on piped/redirected
  // stdin readline buffers character-by-character through `_writeToOutput`,
  // which combined with masking can stall the read.
  if (opts.hidden && process.stdin.isTTY) {
    const r = rl as unknown as {
      _writeToOutput: (s: string) => void;
      output: NodeJS.WritableStream;
    };
    const orig = r._writeToOutput.bind(rl);
    r._writeToOutput = (s: string): void => {
      if (s.length > 0 && s !== "\r\n" && s !== "\n") orig("*");
      else orig(s);
    };
  }
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      if (opts.hidden && process.stdin.isTTY) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

const DIM = "[2m";
const RESET = "[0m";
const PINK = "[38;5;204m";
const GREEN = "[38;5;120m";
const RED = "[38;5;197m";

function emailLooksValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function runLogin(): Promise<void> {
  const existing = readAuth();
  if (existing) {
    process.stdout.write(
      `${DIM}already signed in as${RESET} ${existing.user.email} ${DIM}(use \`failproofai auth --logout\` to switch accounts)${RESET}\n`,
    );
    return;
  }

  process.stdout.write(`${PINK}━━ failproofai auth ━━${RESET}\n`);
  process.stdout.write(`${DIM}api: ${getApiBase()}${RESET}\n\n`);

  let email = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    email = await prompt("email: ");
    if (emailLooksValid(email)) break;
    process.stdout.write(`${RED}that doesn't look like an email — try again.${RESET}\n`);
    email = "";
  }
  if (!email) throw new CliError("Could not read a valid email after 3 attempts.");

  try {
    const r = await requestLoginCode(email);
    process.stdout.write(
      `\n${GREEN}code sent.${RESET} ${DIM}check ${email} — expires in ${r.expires_in}s.${RESET}\n`,
    );
  } catch (err) {
    if (err instanceof AuthApiError && err.code === "rate_limited") {
      throw new CliError(
        `Rate limited — try again in ${err.retryAfterSecs ?? "a few"} seconds.`,
      );
    }
    if (err instanceof AuthApiError) {
      throw new CliError(`Login request failed (${err.code}): ${err.message}`);
    }
    throw new CliError(
      `Could not reach the api-server at ${getApiBase()}.\n` +
        `Set FAILPROOF_API_URL or run the api-server locally on :8080.`,
    );
  }

  let tokenResp;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = await prompt("code:  ", { hidden: true });
    if (!code) continue;
    try {
      tokenResp = await verifyLoginCode(email, code);
      break;
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        process.stdout.write(`${RED}code rejected — try again.${RESET}\n`);
        continue;
      }
      if (err instanceof AuthApiError) {
        throw new CliError(`Verify failed (${err.code}): ${err.message}`);
      }
      throw new CliError(
        `Could not reach the api-server at ${getApiBase()}.`,
      );
    }
  }
  if (!tokenResp) throw new CliError("Too many bad codes — start over.");

  writeAuth(authFromTokenResponse(tokenResp));
  process.stdout.write(
    `\n${GREEN}✓ signed in as ${tokenResp.user.email}${RESET}\n` +
      `${DIM}session saved to ~/.failproofai/auth.json (mode 0600)${RESET}\n`,
  );
}

async function runLogout(): Promise<void> {
  const existing = readAuth();
  if (!existing) {
    process.stdout.write(`${DIM}not signed in. nothing to do.${RESET}\n`);
    return;
  }
  let serverRevoked = false;
  try {
    await logoutSession(existing.access_token, existing.refresh_token);
    serverRevoked = true;
  } catch (err) {
    if (err instanceof AuthApiError && err.status === 401) {
      // Token already invalid — that's fine, we'll still wipe locally.
      serverRevoked = true;
    } else if (err instanceof AuthApiError) {
      process.stdout.write(
        `${RED}server-side revoke failed (${err.code}): ${err.message}${RESET}\n`,
      );
    } else {
      process.stdout.write(
        `${RED}could not reach the api-server — wiping local session only.${RESET}\n`,
      );
    }
  }
  deleteAuth();
  if (serverRevoked) {
    process.stdout.write(`${GREEN}✓ signed out.${RESET}\n`);
  } else {
    process.stdout.write(
      `${GREEN}✓ local session removed.${RESET} ${DIM}server-side revocation may not have completed.${RESET}\n`,
    );
  }
}

async function runWhoami(): Promise<void> {
  const result = await whoAmI();
  if (!result) {
    process.stdout.write(`${DIM}not signed in — run \`failproofai auth --login\` to sign in.${RESET}\n`);
    process.exitCode = 1;
    return;
  }
  const { me } = result;
  process.stdout.write(
    `${GREEN}✓${RESET} ${me.email} ${DIM}(${me.id})${RESET}\n` +
      `${DIM}status: ${me.status} · created: ${me.created_at}${RESET}\n`,
  );
}

export async function runAuthCli(args: string[]): Promise<void> {
  const opts = parseAuthArgs(args);
  if (opts.mode === "help") {
    process.stdout.write(HELP);
    return;
  }
  if (opts.mode === "login") return runLogin();
  if (opts.mode === "logout") return runLogout();
  return runWhoami();
}
