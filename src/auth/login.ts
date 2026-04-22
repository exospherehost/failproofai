import { spawn } from "node:child_process";
import { platform } from "node:os";
import { writeTokens, type AuthTokens } from "./token-store";

const DEFAULT_SERVER_URL = process.env.FAILPROOFAI_SERVER_URL ?? "https://api.befailproof.ai";
const HTTP_TIMEOUT_MS = 10_000;

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string; name?: string };
}

function openBrowser(url: string): void {
  const os = platform();
  try {
    if (os === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else if (os === "win32") {
      // On cmd's `start`, the first quoted token is treated as a window
      // title. Pass an empty title so URLs containing "&" or spaces are
      // interpreted as the target, not the title.
      spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
    // Fallback: the URL is already printed above.
  }
}

async function postJson<T>(url: string, body: unknown, timeoutMs = HTTP_TIMEOUT_MS): Promise<T> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) {
    throw new Error(`${url} → ${resp.status} ${resp.statusText}`);
  }
  return (await resp.json()) as T;
}

export async function login(): Promise<void> {
  const serverUrl = DEFAULT_SERVER_URL;

  console.log("Requesting device code...");
  const dc = await postJson<DeviceCodeResponse>(`${serverUrl}/api/v1/auth/device-code`, {});

  console.log(`\n  Open this URL in your browser (will be opened automatically):`);
  console.log(`    ${dc.verification_url}\n`);
  console.log(`  Your code: ${dc.user_code}\n`);

  openBrowser(dc.verification_url);

  const deadline = Date.now() + dc.expires_in * 1000;
  const intervalMs = dc.interval * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const result = await postJson<TokenResponse | { status: string }>(
        `${serverUrl}/api/v1/auth/device-token`,
        { device_code: dc.device_code },
      );
      if ("access_token" in result) {
        const tokens: AuthTokens = {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + result.expires_in,
          user_email: result.user.email,
          user_id: result.user.id,
          server_url: serverUrl,
        };
        writeTokens(tokens);
        console.log(`Logged in as ${result.user.email}`);

        // Auto-start relay daemon
        try {
          const { ensureRelayRunning } = await import("../relay/daemon");
          ensureRelayRunning();
          console.log("Relay daemon started.");
        } catch (e) {
          console.warn("Failed to auto-start relay daemon:", e);
        }
        return;
      }
    } catch {
      // Pending or transient error — keep polling
    }
  }

  throw new Error("Login timed out. Run `failproofai login` again.");
}
