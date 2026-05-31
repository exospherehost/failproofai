/**
 * Low-level HTTP client for the FailproofAI api-server's /v0/auth/* endpoints.
 *
 * Shared by both the CLI (failproofai auth ...) and the dashboard's Next.js
 * API route proxies. Has no filesystem access — token persistence lives in
 * `./auth-store.ts`.
 *
 * The base URL is resolved from FAILPROOF_API_URL (preferred) or the legacy
 * FAILPROOFAI_API_URL, falling back to http://localhost:8080 for local dev.
 */

export const DEFAULT_API_BASE = "http://localhost:8080";

export function getApiBase(): string {
  const raw =
    process.env.FAILPROOF_API_URL ??
    process.env.FAILPROOFAI_API_URL ??
    DEFAULT_API_BASE;
  return raw.replace(/\/+$/, "");
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSecs?: number;
  constructor(status: number, code: string, message: string, retryAfterSecs?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfterSecs = retryAfterSecs;
    this.name = "AuthApiError";
  }
}

export interface LoginRequestResponse {
  status: "code_sent";
  expires_in: number;
  resend_available_in: number;
}

export interface UserView {
  id: string;
  email: string;
}

export interface TokenResponse {
  token_type: "Bearer";
  access_token: string;
  access_expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  user: UserView;
}

export interface RefreshResponse {
  token_type: "Bearer";
  access_token: string;
  access_expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface MeResponse {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

interface ServerErrorBody {
  // The docs describe `{ code, message }`; the live Rust server returns
  // `{ success: false, code, detail }`. We tolerate either.
  code?: string;
  message?: string;
  detail?: string;
  retry_after_secs?: number;
}

async function parseError(res: Response): Promise<AuthApiError> {
  let body: ServerErrorBody = {};
  try {
    body = (await res.json()) as ServerErrorBody;
  } catch {
    // body might be empty or non-JSON
  }
  const code = body.code ?? `http_${res.status}`;
  const message = body.message ?? body.detail ?? res.statusText ?? "request failed";
  let retryAfterSecs = body.retry_after_secs;
  if (retryAfterSecs === undefined) {
    const h = res.headers.get("retry-after");
    if (h) {
      const n = Number(h);
      if (Number.isFinite(n)) retryAfterSecs = n;
    }
  }
  return new AuthApiError(res.status, code, message, retryAfterSecs);
}

async function postJson<T>(path: string, body: unknown, init?: { accessToken?: string }): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init?.accessToken) headers["authorization"] = `Bearer ${init.accessToken}`;
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

async function getJson<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "GET",
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function requestLoginCode(email: string): Promise<LoginRequestResponse> {
  return postJson<LoginRequestResponse>("/v0/auth/login/request", { email });
}

export async function verifyLoginCode(email: string, code: string): Promise<TokenResponse> {
  return postJson<TokenResponse>("/v0/auth/login/verify", { email, code });
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  return postJson<RefreshResponse>("/v0/auth/token/refresh", {
    refresh_token: refreshToken,
  });
}

export async function logoutSession(accessToken: string, refreshToken: string): Promise<void> {
  await postJson<void>(
    "/v0/auth/logout",
    { refresh_token: refreshToken },
    { accessToken },
  );
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  return getJson<MeResponse>("/v0/auth/me", accessToken);
}

interface JwtClaims {
  sub: string;
  email: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp: number;
  token_type?: string;
}

/**
 * Decode the JWT payload without verifying the signature. Safe for client-side
 * reading (sub, email, exp). Returns null if the token is malformed.
 */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(json) as JwtClaims;
    if (typeof parsed.exp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}
