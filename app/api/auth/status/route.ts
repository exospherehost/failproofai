/**
 * GET /api/auth/status
 *
 * Returns the currently authenticated identity, verifying the locally-stored
 * access token against the api-server's /me endpoint. Refreshes the access
 * token if it's near expiry. Never exposes the refresh token to the browser.
 */
import { NextResponse } from "next/server";
import { whoAmI } from "@/lib/auth/auth-store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await whoAmI();
    if (!result) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: result.me.id,
          email: result.me.email,
          status: result.me.status,
          created_at: result.me.created_at,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { authenticated: false, error: message },
      { status: 200 },
    );
  }
}
