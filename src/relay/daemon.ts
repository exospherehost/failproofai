import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
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
  type QueueEntry,
} from "./queue";

const QUEUE_DIR = join(homedir(), ".failproofai", "cache", "server-queue");
const BATCH_SIZE = 100;
const FLUSH_INTERVAL_MS = 2000;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 60_000;
const HTTP_TIMEOUT_MS = 10_000;
const WS_CONNECT_TIMEOUT_MS = 15_000;
const ACK_TIMEOUT_MS = 30_000;

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

/**
 * Block until the spawned daemon has been observed running, or until the
 * timeout elapses. Used by `relay start` so we don't falsely report
 * "Failed to start daemon" in the split-second window before the child
 * has finished exec-ing.
 */
export async function waitForRelayAlive(timeoutMs = 2_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const pid = readPid();
    if (pid !== null && isProcessAlive(pid)) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
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
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
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

class Relay {
  private readonly ws: WebSocketLike;
  private readonly pendingAcks = new Map<string, (ok: boolean) => void>();
  private closed = false;

  constructor(ws: WebSocketLike) {
    this.ws = ws;
    ws.onmessage = (ev) => this.handleMessage(ev.data);
    ws.onclose = () => this.handleClose();
    ws.onerror = () => this.handleClose();
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data) as { ack?: string; error?: string };
      if (msg.ack && this.pendingAcks.has(msg.ack)) {
        const resolve = this.pendingAcks.get(msg.ack)!;
        this.pendingAcks.delete(msg.ack);
        resolve(true);
      }
    } catch {
      // Ignore unparseable server messages
    }
  }

  private handleClose(): void {
    this.closed = true;
    // Reject all outstanding acks so callers can retry
    for (const [, resolve] of this.pendingAcks) {
      resolve(false);
    }
    this.pendingAcks.clear();
  }

  isClosed(): boolean {
    return this.closed;
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }

  /**
   * Send a batch and wait for the server's ack (keyed on batch_id).
   * Returns true only when the server confirms the insert.
   */
  async sendBatchAndWaitAck(events: QueueEntry[]): Promise<boolean> {
    if (this.closed) return false;
    const batchId = randomUUID();

    const ackPromise = new Promise<boolean>((resolve) => {
      this.pendingAcks.set(batchId, resolve);
      setTimeout(() => {
        if (this.pendingAcks.delete(batchId)) resolve(false);
      }, ACK_TIMEOUT_MS);
    });

    try {
      this.ws.send(JSON.stringify({ batch_id: batchId, events }));
    } catch {
      this.pendingAcks.delete(batchId);
      return false;
    }

    return ackPromise;
  }
}

async function connect(wsUrl: string, token: string): Promise<WebSocketLike> {
  const WSCtor: any = (globalThis as any).WebSocket;
  if (!WSCtor) {
    throw new Error("WebSocket not available in this Node version. Requires Node 22+.");
  }
  const ws: WebSocketLike = new WSCtor(wsUrl);

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      reject(new Error("WebSocket connect timeout"));
    }, WS_CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try {
        ws.send(token);
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    ws.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(e);
    };
    ws.onclose = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error("WebSocket closed before opening"));
    };
  });

  return ws;
}

/**
 * Send all events from a processing file and wait for server acks on every
 * batch. Returns true only when every batch was acknowledged — in that
 * case the caller may delete the processing file.
 */
async function sendProcessingFile(relay: Relay, path: string): Promise<boolean> {
  const events = readProcessingFile(path);
  if (events.length === 0) return true;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const ok = await relay.sendBatchAndWaitAck(batch);
    if (!ok) return false;
  }
  return true;
}

export async function runDaemon(): Promise<void> {
  let reconnectDelay = RECONNECT_BASE_MS;

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
      const relay = new Relay(ws);
      reconnectDelay = RECONNECT_BASE_MS;

      // Drain any orphaned processing files from a prior crash first
      for (const orphan of findOrphanProcessingFiles()) {
        if (relay.isClosed()) break;
        const ok = await sendProcessingFile(relay, orphan);
        if (ok) deleteProcessingFile(orphan);
      }

      while (!relay.isClosed()) {
        let processingFile: string | null = null;
        try {
          processingFile = claimPendingBatch();
        } catch {
          // Transient FS error — retry on next tick
        }

        if (processingFile) {
          const ok = await sendProcessingFile(relay, processingFile);
          if (ok) {
            deleteProcessingFile(processingFile);
          } else {
            // Ack failed or connection dropped — leave file for retry
            break;
          }
        }
        await new Promise((r) => setTimeout(r, FLUSH_INTERVAL_MS));
      }

      relay.close();
    } catch {
      // Connection failed — wait and retry with backoff
    }

    if (existsSync(QUEUE_DIR)) {
      // noop; QUEUE_DIR referenced to preserve import when tree-shaking
    }

    await new Promise((r) => setTimeout(r, reconnectDelay));
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
  }
}

/**
 * One-shot: POST all pending events to the server via REST batch endpoint.
 * Used by `failproofai sync` — same rotate-then-delete pattern, but with
 * HTTP response status as the ack mechanism.
 */
export async function runOneShotSync(): Promise<number> {
  const token = await refreshTokenIfNeeded();
  const tokens = readTokens();
  if (!token || !tokens) {
    throw new Error("Not logged in. Run `failproofai login` first.");
  }

  let total = 0;

  async function postBatch(events: QueueEntry[]): Promise<void> {
    const resp = await fetch(`${tokens!.server_url}/api/v1/events/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!resp.ok) {
      throw new Error(`Sync failed: ${resp.status} ${resp.statusText}`);
    }
  }

  // Drain orphans first
  for (const orphan of findOrphanProcessingFiles()) {
    const events = readProcessingFile(orphan);
    if (events.length > 0) {
      await postBatch(events);
      total += events.length;
    }
    deleteProcessingFile(orphan);
  }

  // Drain fresh pending batch
  const processingFile = claimPendingBatch();
  if (processingFile) {
    const events = readProcessingFile(processingFile);
    if (events.length > 0) {
      await postBatch(events);
      total += events.length;
    }
    deleteProcessingFile(processingFile);
  }

  return total;
}
