/**
 * Persistence layer for the FailproofAI auth.json file.
 *
 * Tokens live at ~/.failproofai/auth.json with mode 0600. The dashboard's
 * Next.js API routes and the CLI both read/write through here so the user's
 * session survives across `failproofai` (dashboard) and `failproofai auth`
 * (CLI) invocations.
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import {
  AuthApiError,
  decodeJwt,
  fetchMe,
  refreshAccessToken,
  type MeResponse,
} from "./api-server-client";

export interface StoredAuth {
  access_token: string;
  refresh_token: string;
  access_expires_at: number; // unix seconds
  refresh_expires_at: number; // unix seconds (best-effort; not strictly verified server-side)
  user: { id: string; email: string };
}

export function getAuthDir(): string {
  const override = process.env.FAILPROOFAI_AUTH_DIR;
  if (override) return override;
  return join(homedir(), ".failproofai");
}

export function getAuthFilePath(): string {
  return join(getAuthDir(), "auth.json");
}

export function readAuth(): StoredAuth | null {
  const p = getAuthFilePath();
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (
      typeof parsed.access_token !== "string" ||
      typeof parsed.refresh_token !== "string" ||
      typeof parsed.access_expires_at !== "number" ||
      typeof parsed.user !== "object" ||
      !parsed.user ||
      typeof (parsed.user as { id?: unknown }).id !== "string" ||
      typeof (parsed.user as { email?: unknown }).email !== "string"
    ) {
      return null;
    }
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      access_expires_at: parsed.access_expires_at,
      refresh_expires_at:
        typeof parsed.refresh_expires_at === "number"
          ? parsed.refresh_expires_at
          : parsed.access_expires_at,
      user: {
        id: (parsed.user as { id: string }).id,
        email: (parsed.user as { email: string }).email,
      },
    };
  } catch {
    return null;
  }
}

export function writeAuth(auth: StoredAuth): void {
  const p = getAuthFilePath();
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  // mode 0600 on first write; the explicit chmod ensures we reset perms if the
  // file existed with looser perms.
  writeFileSync(p, JSON.stringify(auth, null, 2), { mode: 0o600 });
  // writeFileSync's mode option only applies on file creation. If the file
  // already existed with looser perms, force them back to 0600.
  try {
    if (statSync(p).mode & 0o077) chmodSync(p, 0o600);
  } catch {
    // best-effort
  }
}

export function deleteAuth(): void {
  const p = getAuthFilePath();
  if (existsSync(p)) rmSync(p, { force: true });
}

/** Convert verify/refresh response into the on-disk shape. */
export function authFromTokenResponse(token: {
  access_token: string;
  refresh_token: string;
  access_expires_in: number;
  refresh_expires_in: number;
  user?: { id: string; email: string };
}, existingUser?: { id: string; email: string }): StoredAuth {
  const now = Math.floor(Date.now() / 1000);
  const user = token.user ?? existingUser;
  if (!user) {
    throw new Error("authFromTokenResponse: missing user identity");
  }
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    access_expires_at: now + token.access_expires_in,
    refresh_expires_at: now + token.refresh_expires_in,
    user,
  };
}

/**
 * Return a fresh access token, refreshing in-place if the current one is
 * within the leeway window of expiry. Mutates auth.json on disk on success.
 * Returns null if the stored session is gone or the refresh failed (caller
 * should treat that as "logged out").
 */
const REFRESH_LEEWAY_SECS = 60;

export async function getValidAccessToken(): Promise<StoredAuth | null> {
  const auth = readAuth();
  if (!auth) return null;
  const now = Math.floor(Date.now() / 1000);
  if (auth.access_expires_at - now > REFRESH_LEEWAY_SECS) return auth;
  // Either expired or close to expiring — try to refresh.
  try {
    const refreshed = await refreshAccessToken(auth.refresh_token);
    const next = authFromTokenResponse(refreshed, auth.user);
    writeAuth(next);
    return next;
  } catch (err) {
    if (err instanceof AuthApiError && err.status === 401) {
      // Session unrecoverable — wipe.
      deleteAuth();
      return null;
    }
    // Network errors etc — surface to caller as null so the UI can recover.
    return null;
  }
}

/**
 * Verify with the server that the stored access token is still valid.
 * Refreshes once on 401. Returns the live /me response and the (possibly
 * refreshed) stored auth, or null if the session can't be recovered.
 */
export async function whoAmI(): Promise<{ me: MeResponse; auth: StoredAuth } | null> {
  const fresh = await getValidAccessToken();
  if (!fresh) return null;
  try {
    const me = await fetchMe(fresh.access_token);
    return { me, auth: fresh };
  } catch (err) {
    if (err instanceof AuthApiError && err.status === 401) {
      // Maybe the leeway wasn't enough — try one more refresh and retry.
      const reread = readAuth();
      if (!reread) return null;
      try {
        const refreshed = await refreshAccessToken(reread.refresh_token);
        const next = authFromTokenResponse(refreshed, reread.user);
        writeAuth(next);
        const me = await fetchMe(next.access_token);
        return { me, auth: next };
      } catch {
        deleteAuth();
        return null;
      }
    }
    return null;
  }
}

/** Reads the JWT exp claim for diagnostics. */
export function readAccessExpiry(auth: StoredAuth): number | null {
  const claims = decodeJwt(auth.access_token);
  return claims?.exp ?? null;
}
