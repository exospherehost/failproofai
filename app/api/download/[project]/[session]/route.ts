import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { logActivity } from "@/lib/logger";
import { resolveSessionFilePath } from "@/lib/projects";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ project: string; session: string }> }
): Promise<NextResponse> {
  const { project, session } = await params;

  let filePath: string;
  try {
    // resolveSessionFilePath validates UUID format, rejects absolute/escaping paths
    filePath = resolveSessionFilePath(project, session);
  } catch {
    return jsonError("Invalid project or session", 400);
  }

  logActivity("anonymous", "download-log", `project=${project} session=${session}`);

  try {
    // Eagerly check file existence — createReadStream errors are async and would
    // escape the try/catch after response headers are already sent.
    await stat(filePath);
    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Content-Disposition": `attachment; filename="${session}.jsonl"`,
      },
    });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || e instanceof RangeError) {
      return jsonError("Session log not found", 404);
    }
    return jsonError("Failed to read session log", 500);
  }
}
