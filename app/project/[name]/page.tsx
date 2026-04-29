/** Project page — shows metadata and a filterable sessions list for a single project. */
import { Suspense } from "react";
import { resolveProjectPath, getCachedSessionFiles, type SessionFile } from "@/lib/projects";
import { getCachedCodexSessionsByEncodedName } from "@/lib/codex-projects";
import { logWarn } from "@/lib/logger";
import { decodeFolderName } from "@/lib/paths";
import { notFound } from "next/navigation";
import { existsSync } from "fs";
import { stat } from "fs/promises";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import SessionsList from "@/app/components/sessions-list";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { name } = await params;
  // Resolve under ~/.claude/projects/. Validation may throw RangeError; on bad input
  // we still want to try Codex, since a Codex-only cwd never escapes this check.
  let claudeProjectPath: string | null = null;
  try {
    claudeProjectPath = resolveProjectPath(name);
  } catch {
    claudeProjectPath = null;
  }
  const decodedName = decodeFolderName(name);

  const claudeExists = claudeProjectPath ? existsSync(claudeProjectPath) : false;

  let claudeSessions: SessionFile[] = [];
  if (claudeExists && claudeProjectPath) {
    claudeSessions = await getCachedSessionFiles(claudeProjectPath);
  }
  // Note: decodeFolderName is lossy when cwds contain `-` (every `-` becomes `/`),
  // so we look up Codex sessions by re-encoding each session's cwd and matching the slug.
  const codex = await getCachedCodexSessionsByEncodedName(name);
  const codexSessions = codex.sessions;

  if (!claudeExists && codexSessions.length === 0) {
    notFound();
  }

  // Prefer the canonical Codex cwd when available — `decodeFolderName(name)` is
  // ambiguous for cwds containing `-` (every `-` becomes `/`). Codex transcripts
  // record the literal cwd, so they round-trip correctly.
  const canonicalRoot = codex.cwd ?? decodedName;

  // Project header metadata
  let lastModified: Date | null = null;
  let lastModifiedFormatted: string | null = null;
  if (claudeExists && claudeProjectPath) {
    try {
      const stats = await stat(claudeProjectPath);
      lastModified = stats.mtime;
      lastModifiedFormatted = formatDate(stats.mtime);
    } catch (error) {
      logWarn(`Failed to get stats for project ${decodedName}:`, error);
    }
  }
  const newestCodex = codexSessions[0]?.lastModified ?? null;
  if (newestCodex && (!lastModified || newestCodex.getTime() > lastModified.getTime())) {
    lastModified = newestCodex;
    lastModifiedFormatted = formatDate(newestCodex);
  }

  const sessionFiles: SessionFile[] = [...claudeSessions, ...codexSessions].sort(
    (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
  );

  // Path line: prefer the Claude storage dir if present (matches existing UX);
  // otherwise show the canonical Codex cwd.
  const displayPath = claudeExists && claudeProjectPath ? claudeProjectPath : canonicalRoot;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 break-words break-all">
            {canonicalRoot}
          </h1>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              <span className="font-medium">Path:</span> {displayPath}
            </p>
            {lastModifiedFormatted && (
              <p className="text-muted-foreground">
                <span className="font-medium">Modified:</span> {lastModifiedFormatted}
              </p>
            )}
          </div>
        </div>

        {/* Sessions Section */}
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Sessions</h2>

          {sessionFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No .jsonl files found in this project.
              </p>
              <p className="text-sm text-muted-foreground">
                Session files will appear here once they are created.
              </p>
            </div>
          ) : (
            <Suspense><SessionsList files={sessionFiles} projectName={name} /></Suspense>
          )}
        </div>
      </div>
    </main>
  );
}
