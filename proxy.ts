import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const disabled = (process.env.FAILPROOFAI_DISABLE_PAGES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!disabled.includes("policies")) {
      return NextResponse.redirect(new URL("/policies", request.url));
    }
    if (!disabled.includes("projects")) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|exospheresmall).*)"],
};
