import type { LogEntryType } from "@/lib/log-entries";

export const TYPE_LABELS: Record<LogEntryType, string> = {
  user: "User",
  assistant: "Assistant",
  "file-history-snapshot": "Snapshot",
  progress: "Progress",
  system: "System",
  "queue-operation": "Queue",
};

export const TYPE_COLORS: Record<LogEntryType, string> = {
  user: "bg-[color:var(--chart-1)]/20 text-[color:var(--chart-1)] border-[color:var(--chart-1)]/30",
  assistant:
    "bg-[color:var(--chart-2)]/20 text-[color:var(--chart-2)] border-[color:var(--chart-2)]/30",
  "file-history-snapshot":
    "bg-[color:var(--chart-3)]/20 text-[color:var(--chart-3)] border-[color:var(--chart-3)]/30",
  progress:
    "bg-[color:var(--chart-5)]/20 text-[color:var(--chart-5)] border-[color:var(--chart-5)]/30",
  system:
    "bg-[color:var(--chart-4)]/20 text-[color:var(--chart-4)] border-[color:var(--chart-4)]/30",
  "queue-operation":
    "bg-primary/20 text-primary border-primary/30",
};

export const ENTRY_BORDER_COLORS: Record<LogEntryType, string> = {
  user: "border-l-[color:var(--chart-1)]",
  assistant: "border-l-[color:var(--chart-2)]",
  "file-history-snapshot": "border-l-[color:var(--chart-3)]",
  progress: "border-l-[color:var(--chart-5)]",
  system: "border-l-[color:var(--chart-4)]",
  "queue-operation": "border-l-primary",
};
