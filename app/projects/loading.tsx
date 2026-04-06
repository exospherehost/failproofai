/** Skeleton loading UI for the projects page. */
export default function ProjectsLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
