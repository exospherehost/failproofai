/**
 * Tiny CLI-origin badge — orange for Claude Code, purple for OpenAI Codex.
 * Mirrors the IntegrationBadge styling in `app/policies/hooks-client.tsx`,
 * extracted here for reuse across the projects listing, project detail page,
 * and session viewer.
 */
import type { ProjectCli } from "@/lib/projects";

export function CliBadge({ cli }: { cli: ProjectCli }) {
  const isCodex = cli === "codex";
  const label = isCodex ? "OpenAI Codex" : "Claude Code";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-medium border ${
        isCodex
          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
      }`}
      title={`Agent CLI: ${label}`}
    >
      {label}
    </span>
  );
}
