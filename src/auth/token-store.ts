import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, chmodSync } from "node:fs";
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

export function readTokens(): AuthTokens | null {
  if (!existsSync(AUTH_FILE)) return null;
  try {
    const raw = readFileSync(AUTH_FILE, "utf8");
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function writeTokens(tokens: AuthTokens): void {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(AUTH_FILE, JSON.stringify(tokens, null, 2));
  try {
    chmodSync(AUTH_FILE, 0o600);
  } catch {
    // Windows doesn't support chmod; ignore
  }
}

export function clearTokens(): void {
  if (existsSync(AUTH_FILE)) unlinkSync(AUTH_FILE);
}

export function isLoggedIn(): boolean {
  return readTokens() !== null;
}
