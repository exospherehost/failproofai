/**
 * POST /api/auth/logout
 *
 * Reads the locally-stored session, asks the api-server to revoke it, and
 * deletes ~/.failproofai/auth.json regardless of upstream success — local
 * intent to log out takes precedence.
 */
import { NextResponse } from "next/server";
import { AuthApiError, logoutSession } from "@/lib/auth/api-server-client";
import { deleteAuth, readAuth } from "@/lib/auth/auth-store";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  const existing = readAuth();
  if (!existing) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  let upstream: "revoked" | "skipped" | "failed" = "skipped";
  try {
    await logoutSession(existing.access_token, existing.refresh_token);
    upstream = "revoked";
  } catch (err) {
    if (err instanceof AuthApiError && err.status === 401) {
      upstream = "revoked"; // token already invalid server-side
    } else {
      upstream = "failed";
    }
  }
  deleteAuth();
  return NextResponse.json({ authenticated: false, upstream }, { status: 200 });
}
