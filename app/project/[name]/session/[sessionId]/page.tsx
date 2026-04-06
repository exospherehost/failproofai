/** Session page — parses and displays a single session's JSONL log via the Raw Log Viewer. */
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getCachedSessionLog } from "@/lib/log-entries";
import { decodeFolderName } from "@/lib/paths";
import { baseSessionId } from "@/lib/utils/session-id";
import LazyLogViewer from "@/app/components/lazy-log-viewer";
import { CopyButton } from "@/app/components/copy-button";

export const dynamic = "force-dynamic";

interface SessionPageProps {
  params: Promise<{
    name: string;
    sessionId: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { name, sessionId } = await params;
  const decodedName = decodeURIComponent(name);
  const decodedSessionId = baseSessionId(decodeURIComponent(sessionId));

  let entries = null;
  let rawLines: Record<string, unknown>[] | null = null;
  let error: string | null = null;

  try {
    const result = await getCachedSessionLog(decodedName, decodedSessionId);
    entries = result.entries;
    rawLines = result.rawLines;
  } catch (e) {
    const isNotFound = (e as NodeJS.ErrnoException).code === "ENOENT";
    error = isNotFound ? "Session log file not found." : "Failed to read session log.";
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <Link
          href={`/project/${encodeURIComponent(decodedName)}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sessions</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Session Log
          </h1>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              <span className="font-medium">Project:</span>{" "}
              {decodeFolderName(decodedName)}
            </p>
            <p className="text-muted-foreground break-words break-all inline-flex items-center gap-1">
              <span className="font-medium">Session:</span> {decodedSessionId}
              <CopyButton text={decodedSessionId} />
            </p>
            {entries && rawLines && (
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  <span className="font-medium">{rawLines.length}</span> log lines
                </p>
                <a
                  href={`/api/download/${encodeURIComponent(decodedName)}/${encodeURIComponent(decodedSessionId)}`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Logs
                </a>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-card text-card-foreground rounded-lg border border-destructive/50 p-6 shadow-sm">
            <p className="text-destructive text-center py-8">{error}</p>
          </div>
        )}
        {!error && entries && (
          <LazyLogViewer entries={entries} projectName={decodedName} sessionId={decodedSessionId} />
        )}
      </div>
    </main>
  );
}
