/** Projects page — lists all Claude Agent SDK project folders. */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedProjectFolders } from "@/lib/projects";
import ProjectList from "@/app/components/project-list";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const disabled = (process.env.FAILPROOFAI_DISABLE_PAGES ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  if (disabled.includes("projects")) notFound();

  const folders = await getCachedProjectFolders();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Projects</h2>

          {folders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No projects found in the .claude/projects directory.
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure the directory exists and contains project folders.
              </p>
            </div>
          ) : (
            <Suspense><ProjectList folders={folders} /></Suspense>
          )}
        </div>
      </div>
    </main>
  );
}
