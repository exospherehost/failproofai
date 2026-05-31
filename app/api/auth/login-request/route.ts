/**
 * POST /api/auth/login-request
 *
 * Browser-facing proxy for the api-server's /v0/auth/login/request. Keeps the
 * api-server URL server-side so the browser only ever talks to the local
 * dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { AuthApiError, requestLoginCode } from "@/lib/auth/api-server-client";

export const dynamic = "force-dynamic";

interface RequestBody {
  email?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ code: "validation_error", message: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json(
      { code: "validation_error", message: "email is required" },
      { status: 400 },
    );
  }
  try {
    const r = await requestLoginCode(body.email);
    return NextResponse.json(
      {
        status: r.status,
        expires_in: r.expires_in,
        resend_available_in: r.resend_available_in,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof AuthApiError) {
      return NextResponse.json(
        {
          code: err.code,
          message: err.message,
          ...(err.retryAfterSecs !== undefined ? { retry_after_secs: err.retryAfterSecs } : {}),
        },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { code: "upstream_unreachable", message: `api-server unreachable: ${message}` },
      { status: 502 },
    );
  }
}
