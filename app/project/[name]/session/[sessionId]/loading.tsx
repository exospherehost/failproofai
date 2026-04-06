/** Skeleton loading UI for the session page (log viewer). */
export default function SessionLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        {/* Back button placeholder */}
        <div className="h-5 w-36 bg-muted rounded animate-pulse mb-6" />

        {/* Title placeholder */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-muted/50 rounded animate-pulse mb-1" />
          <div className="h-4 w-56 bg-muted/50 rounded animate-pulse" />
        </div>

        {/* Stats bar skeleton */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Entry skeletons */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
