import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/logger";
import { getCachedSessionLog } from "@/lib/log-entries";

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const PATH_TRAVERSAL_RE = /(^|[\\/])\.\.($|[\\/])/;

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ project: string; session: string }> }
): Promise<NextResponse> {
  const { project, session } = await params;

  if (!UUID_RE.test(session)) {
    return jsonError("Invalid session ID", 400);
  }

  if (!project || PATH_TRAVERSAL_RE.test(project)) {
    return jsonError("Invalid project name", 400);
  }

  logActivity("anonymous", "download-log", `project=${project} session=${session}`);

  try {
    const { rawLines } = await getCachedSessionLog(project, session);
    const combined = rawLines.map(r => JSON.stringify(r)).join("\n") + "\n";

    return new NextResponse(combined, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": `attachment; filename="${session}.jsonl"`,
      },
    });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return jsonError("Session log not found", 404);
    }
    return jsonError("Failed to read session log", 500);
  }
}
