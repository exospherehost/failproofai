import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

const PID_FILE = join(homedir(), ".failproofai", "relay.pid");

export function readPid(): number | null {
  if (!existsSync(PID_FILE)) return null;
  try {
    const raw = readFileSync(PID_FILE, "utf8").trim();
    const pid = parseInt(raw, 10);
    if (Number.isNaN(pid) || pid <= 0) return null;
    return pid;
  } catch {
    return null;
  }
}

export function writePid(pid: number): void {
  const dir = dirname(PID_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(PID_FILE, String(pid));
}

export function clearPid(): void {
  if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
}

interface ErrnoError extends Error {
  code?: string;
}

/**
 * `process.kill(pid, 0)` sends signal 0 as an existence probe.
 *
 *   no throw  → PID exists and we can signal it
 *   ESRCH     → PID doesn't exist (process is gone)
 *   EPERM     → PID exists but belongs to a different user — still ALIVE,
 *               just unsignalable by us. Treating this as "dead" would cause
 *               us to clear the PID file and spawn a second daemon while
 *               the first keeps running.
 */
export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const e = err as ErrnoError;
    // EPERM means the process exists but we can't signal it — still alive
    if (e?.code === "EPERM") return true;
    // ESRCH or anything else → treat as dead
    return false;
  }
}

export function stopRelay(): boolean {
  const pid = readPid();
  if (pid === null) return false;
  if (!isProcessAlive(pid)) {
    clearPid();
    return false;
  }
  try {
    process.kill(pid, "SIGTERM");
    clearPid();
    return true;
  } catch {
    return false;
  }
}

export function relayStatus(): { running: boolean; pid: number | null } {
  const pid = readPid();
  if (pid === null) return { running: false, pid: null };
  return { running: isProcessAlive(pid), pid };
}
