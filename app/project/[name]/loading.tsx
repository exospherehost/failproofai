/** Skeleton loading UI for the project page (sessions list). */
export default function ProjectLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        {/* Back button placeholder */}
        <div className="h-5 w-36 bg-muted rounded animate-pulse mb-6" />

        {/* Title placeholder */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
        </div>

        {/* Sessions table skeleton */}
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
          <div className="h-8 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
