import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  renameSync,
  openSync,
  closeSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_email: string;
  user_id: string;
  server_url: string;
}

const AUTH_DIR = join(homedir(), ".failproofai");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

function ensureAuthDir(): void {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 });
}

export function readTokens(): AuthTokens | null {
  if (!existsSync(AUTH_FILE)) return null;
  try {
    const raw = readFileSync(AUTH_FILE, "utf8");
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

/**
 * Write tokens atomically with 0600 permissions *from creation*.
 * We open with O_WRONLY|O_CREAT|O_TRUNC and explicit mode 0600 so the
 * file is never world-readable, not even briefly during the write.
 * Then rename into place (atomic on POSIX).
 */
export function writeTokens(tokens: AuthTokens): void {
  ensureAuthDir();
  const tmpPath = `${AUTH_FILE}.tmp`;
  const fd = openSync(tmpPath, "w", 0o600);
  try {
    writeFileSync(fd, JSON.stringify(tokens, null, 2));
  } finally {
    closeSync(fd);
  }
  renameSync(tmpPath, AUTH_FILE);
}

export function clearTokens(): void {
  if (existsSync(AUTH_FILE)) unlinkSync(AUTH_FILE);
}

export function isLoggedIn(): boolean {
  return existsSync(AUTH_FILE);
}
