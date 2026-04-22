import { spawn } from "node:child_process";
import { watch, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { readTokens, writeTokens, isLoggedIn } from "../auth/token-store";
import { readPid, writePid, clearPid, isProcessAlive } from "./pid";
import {
  claimPendingBatch,
  readProcessingFile,
  deleteProcessingFile,
  findOrphanProcessingFiles,
} from "./queue";

const QUEUE_DIR = join(homedir(), ".failproofai", "cache", "server-queue");
const BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 2000;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 60_000;

/**
 * Lazy-start check: call on every hook invocation. Near-zero cost when daemon
 * is already running (~1ms PID check); spawns daemon once after reboots.
 */
export function ensureRelayRunning(): void {
  if (!isLoggedIn()) return;

  const pid = readPid();
  if (pid !== null && isProcessAlive(pid)) return;

  if (pid !== null) clearPid();
  spawnDaemon();
}

function spawnDaemon(): void {
  const entrypoint = process.env.FAILPROOFAI_RELAY_ENTRYPOINT ?? process.argv[1];
  if (!entrypoint) return;

  const child = spawn(process.execPath, [entrypoint, "--relay-daemon"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, FAILPROOFAI_DAEMON: "1" },
  });
  child.unref();

  if (typeof child.pid === "number") {
    writePid(child.pid);
  }
}

async function refreshTokenIfNeeded(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (tokens.expires_at - nowSec > 300) {
    return tokens.access_token;
  }

  try {
    const resp = await fetch(`${tokens.server_url}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    if (!resp.ok) return tokens.access_token;
    const refreshed = (await resp.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    writeTokens({
      ...tokens,
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: nowSec + refreshed.expires_in,
    });
    return refreshed.access_token;
  } catch {
    return tokens.access_token;
  }
}

type WebSocketLike = {
  send(data: string): void;
  close(): void;
  readyState: number;
  onopen: (() => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: (() => void) | null;
};

async function connect(wsUrl: string, token: string): Promise<WebSocketLike> {
  const WSCtor: any = (globalThis as any).WebSocket;
  if (!WSCtor) {
    throw new Error("WebSocket not available in this Node version. Requires Node 22+.");
  }
  const ws: WebSocketLike = new WSCtor(wsUrl);

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => {
      ws.send(token);
      resolve();
    };
    ws.onerror = (e) => reject(e);
  });

  return ws;
}

/**
 * Send all events from a processing file to the server. Returns true on
 * success (file can be deleted), false on failure (file remains for retry).
 */
async function sendProcessingFile(ws: WebSocketLike, path: string): Promise<boolean> {
  const lines = readProcessingFile(path);
  if (lines.length === 0) return true;

  // Annotate each event with a client-side event_id so retries are idempotent
  const events = lines.map((l) => {
    const event = JSON.parse(l);
    if (!event.client_event_id) event.client_event_id = randomUUID();
    return event;
  });

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    try {
      ws.send(JSON.stringify(batch));
    } catch {
      return false;
    }
  }
  return true;
}

export async function runDaemon(): Promise<void> {
  let reconnectDelay = RECONNECT_BASE_MS;

  // fs.watch is a hint — we also poll on flush interval
  if (existsSync(QUEUE_DIR)) {
    try {
      watch(QUEUE_DIR, () => {});
    } catch {
      // fs.watch can fail on some platforms; polling still covers it
    }
  }

  while (true) {
    const token = await refreshTokenIfNeeded();
    const tokens = readTokens();
    if (!token || !tokens) {
      await new Promise((r) => setTimeout(r, 30_000));
      continue;
    }

    const wsUrl = `${tokens.server_url.replace(/^http/, "ws")}/ws/events/ingest`;

    try {
      const ws = await connect(wsUrl, token);
      reconnectDelay = RECONNECT_BASE_MS;

      let closed = false;
      ws.onclose = () => {
        closed = true;
      };
      ws.onerror = () => {
        closed = true;
      };

      // On (re)connect, drain any orphaned processing files first
      for (const orphan of findOrphanProcessingFiles()) {
        if (closed) break;
        const ok = await sendProcessingFile(ws, orphan);
        if (ok) deleteProcessingFile(orphan);
      }

      while (!closed) {
        const processingFile = claimPendingBatch();
        if (processingFile) {
          const ok = await sendProcessingFile(ws, processingFile);
          if (ok) {
            deleteProcessingFile(processingFile);
          } else {
            break; // leave file for retry on reconnect
          }
        }
        await new Promise((r) => setTimeout(r, FLUSH_INTERVAL_MS));
      }

      try {
        ws.close();
      } catch {
        // ignore
      }
    } catch {
      // Connection failed — wait and retry
    }

    await new Promise((r) => setTimeout(r, reconnectDelay));
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
  }
}

/**
 * One-shot: POST all pending events to the server via REST batch endpoint.
 * Uses the same rotate-then-delete pattern so the hook path is never blocked.
 */
export async function runOneShotSync(): Promise<number> {
  const token = await refreshTokenIfNeeded();
  const tokens = readTokens();
  if (!token || !tokens) {
    throw new Error("Not logged in. Run `failproofai login` first.");
  }

  let total = 0;

  // Drain orphans first
  for (const orphan of findOrphanProcessingFiles()) {
    const lines = readProcessingFile(orphan);
    if (lines.length === 0) {
      deleteProcessingFile(orphan);
      continue;
    }
    const events = lines.map((l) => {
      const e = JSON.parse(l);
      if (!e.client_event_id) e.client_event_id = randomUUID();
      return e;
    });
    const resp = await fetch(`${tokens.server_url}/api/v1/events/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events }),
    });
    if (!resp.ok) {
      throw new Error(`Sync failed: ${resp.status} ${resp.statusText}`);
    }
    deleteProcessingFile(orphan);
    total += events.length;
  }

  // Drain fresh pending batch
  const processingFile = claimPendingBatch();
  if (processingFile) {
    const lines = readProcessingFile(processingFile);
    const events = lines.map((l) => {
      const e = JSON.parse(l);
      if (!e.client_event_id) e.client_event_id = randomUUID();
      return e;
    });
    const resp = await fetch(`${tokens.server_url}/api/v1/events/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events }),
    });
    if (!resp.ok) {
      throw new Error(`Sync failed: ${resp.status} ${resp.statusText}`);
    }
    deleteProcessingFile(processingFile);
    total += events.length;
  }

  return total;
}
