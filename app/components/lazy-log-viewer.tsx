"use client";

import dynamic from "next/dynamic";
import type { LogEntry } from "@/lib/log-entries";

const RawLogViewer = dynamic(
  () => import("@/app/components/log-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse text-muted-foreground">Loading log viewer...</div>
        </div>
      </div>
    ),
  }
);

interface LazyLogViewerProps {
  entries: LogEntry[];
  projectName: string;
  sessionId: string;
}

export default function LazyLogViewer({ entries, projectName, sessionId }: LazyLogViewerProps) {
  return <RawLogViewer entries={entries} projectName={projectName} sessionId={sessionId} />;
}
