/** Project page — shows metadata and a filterable sessions list for a single project. */
import { Suspense } from "react";
import { resolveAnyProjectPath, getCachedSessionFiles } from "@/lib/projects";
import { logWarn } from "@/lib/logger";
import { decodeFolderName } from "@/lib/paths";
import { notFound } from "next/navigation";
import { existsSync } from "fs";
import { stat } from "fs/promises";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import SessionsList from "@/app/components/sessions-list";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { name } = await params;
  // Next.js already decodes route params once; resolveAnyProjectPath validates and
  // canonicalizes against Claude and Copilot roots, throwing RangeError on invalid input.
  let projectPath: string;
  try {
    projectPath = resolveAnyProjectPath(name).path;
  } catch {
    notFound();
  }
  const decodedName = decodeFolderName(name);

  // Check if project exists
  if (!existsSync(projectPath)) {
    notFound();
  }

  // Get project stats for last modified date
  let lastModified: Date | null = null;
  let lastModifiedFormatted: string | null = null;
  try {
    const stats = await stat(projectPath);
    lastModified = stats.mtime;
    lastModifiedFormatted = formatDate(stats.mtime);
  } catch (error) {
    logWarn(`Failed to get stats for project ${decodedName}:`, error);
  }

  // Get session files
  const sessionFiles = await getCachedSessionFiles(projectPath);

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
            {decodedName}
          </h1>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              <span className="font-medium">Path:</span> {projectPath}
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
