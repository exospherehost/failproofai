import { readTokens, clearTokens } from "./token-store";
import { stopRelay } from "../relay/pid";

const LOGOUT_TIMEOUT_MS = 3_000;

export async function logout(): Promise<void> {
  const tokens = readTokens();
  if (!tokens) {
    console.log("Not logged in.");
    return;
  }

  // Best-effort server revoke with a short timeout — the local logout
  // must not block on a slow network.
  try {
    await fetch(`${tokens.server_url}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS),
    });
  } catch {
    // Network or timeout — proceed to local clear anyway
  }

  try {
    stopRelay();
  } catch {
    // Best-effort daemon stop
  }

  clearTokens();
  console.log("Logged out.");
}

export function whoami(): void {
  const tokens = readTokens();
  if (!tokens) {
    console.log("Not logged in. Run `failproofai login` to authenticate.");
    process.exit(1);
  }
  console.log(`Logged in as ${tokens.user_email}`);
  console.log(`Server: ${tokens.server_url}`);
  const expiresIn = tokens.expires_at - Math.floor(Date.now() / 1000);
  if (expiresIn > 0) {
    console.log(`Access token expires in ${Math.floor(expiresIn / 60)} minutes`);
  } else {
    console.log(`Access token expired (will refresh on next use)`);
  }
}
