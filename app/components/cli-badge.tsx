/**
 * Tiny CLI-origin badge. Visual style and label are sourced from
 * `lib/cli-registry.ts` so adding a new agent CLI = one registry entry, no UI
 * changes here.
 */
import type { ProjectCli } from "@/lib/projects";
import { getCliLabel, getCliBadgeClasses } from "@/lib/cli-registry";

export function CliBadge({ cli }: { cli: ProjectCli }) {
  const label = getCliLabel(cli);
  const classes = getCliBadgeClasses(cli);
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-medium border ${classes}`}
      title={`Agent CLI: ${label}`}
    >
      {label}
    </span>
  );
}
