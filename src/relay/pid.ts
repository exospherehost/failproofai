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
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(PID_FILE, String(pid));
}

export function clearPid(): void {
  if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
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
