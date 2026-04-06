import React from "react";
import { Play, ChevronRight } from "lucide-react";
import type { QueueOperationEntry } from "@/lib/log-entries";
import { formatLocalTimestamp } from "@/lib/log-format";

interface QueueDividerProps {
  entry: QueueOperationEntry;
  isCollapsed?: boolean;
  entryCount?: number;
  onToggle?: () => void;
}

export const QueueDivider = React.memo(function QueueDivider({
  entry,
  isCollapsed,
  entryCount,
  onToggle,
}: QueueDividerProps) {
  const interactive = typeof onToggle === "function";

  const pill = (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium${interactive ? " group-hover:bg-primary/20 transition-colors" : ""}`}>
      {interactive ? (
        <ChevronRight
          className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
        />
      ) : (
        <Play className="w-3 h-3" />
      )}
      <span>{entry.label}</span>
      <span className="text-muted-foreground">{formatLocalTimestamp(entry.timestampMs)}</span>
      {interactive && isCollapsed && typeof entryCount === "number" && (
        <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/20 text-[10px] leading-none">
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
      )}
    </div>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="group flex items-center gap-3 py-3 px-4 w-full cursor-pointer"
      >
        <div className="flex-1 h-px bg-primary/30" />
        {pill}
        <div className="flex-1 h-px bg-primary/30" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className="flex-1 h-px bg-primary/30" />
      {pill}
      <div className="flex-1 h-px bg-primary/30" />
    </div>
  );
});
