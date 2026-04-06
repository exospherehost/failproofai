import type { LogEntryType } from "@/lib/log-entries";
import { EntryIcon } from "./entry-icon";
import { TYPE_LABELS, TYPE_COLORS } from "./constants";

export function TypeBadge({ type }: { type: LogEntryType }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono rounded border ${TYPE_COLORS[type]}`}
    >
      <EntryIcon type={type} />
      {TYPE_LABELS[type]}
    </span>
  );
}
