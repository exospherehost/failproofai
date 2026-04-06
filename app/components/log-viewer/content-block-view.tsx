import React, { useMemo } from "react";
import { Brain, Wrench } from "lucide-react";
import type {
  ContentBlock,
  LogEntry,
  UserEntry,
  AssistantEntry,
  GenericEntry,
} from "@/lib/log-entries";
import { formatRaw } from "@/lib/log-format";
import { ToolInputOutput } from "./tool-input-output";

// Forward declaration — SubagentToolCard is in entry-row.tsx to keep the
// recursive EntryRow <-> SubagentToolCard pair co-located.
import { SubagentToolCard } from "./entry-row";

interface ContentBlockViewProps {
  block: ContentBlock;
  allEntries?: LogEntry[];
  projectName: string;
  sessionId: string;
  highlightedUuid?: string | null;
  autoExpandForUuid?: string | null;
}

export const ContentBlockView = React.memo(function ContentBlockView({ block, allEntries, projectName, sessionId, highlightedUuid, autoExpandForUuid }: ContentBlockViewProps) {
  switch (block.type) {
    case "text":
      return <p className="whitespace-pre-wrap text-sm">{block.text}</p>;
    case "tool_use":
      if (block.name === "Task" && (block.subagentType || block.subagentId)) {
        const subagentEntries = block.subagentId && allEntries
          ? allEntries.filter(e => e._source === `agent-${block.subagentId}`)
          : undefined;
        return (
          <SubagentToolCard
            block={block}
            subagentEntries={subagentEntries}
            projectName={projectName}
            sessionId={sessionId}
            highlightedUuid={highlightedUuid}
            autoExpandForUuid={autoExpandForUuid}
          />
        );
      }
      return (
        <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-mono text-sm text-primary truncate min-w-0">
              {block.name}
            </span>
            {block.result && (
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                {block.result.durationFormatted}
              </span>
            )}
          </div>
          <ToolInputOutput block={block} />
        </div>
      );
    case "thinking":
      return (
        <div className="border border-[color:var(--chart-5)]/30 rounded-lg p-3 bg-[color:var(--chart-5)]/5">
          <details>
            <summary className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground transition-colors text-[color:var(--chart-5)]">
              <Brain className="w-4 h-4" />
              <span>Thinking</span>
              <span className="text-muted-foreground ml-1">
                ({block.thinking.length.toLocaleString()} chars)
              </span>
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground p-2 bg-muted/30 rounded max-h-64 overflow-y-auto">
              {block.thinking}
            </p>
          </details>
        </div>
      );
  }
});

export function UserContent({ entry }: { entry: UserEntry }) {
  return (
    <div>
      {entry.message.content && (
        <p className="whitespace-pre-wrap text-sm">{entry.message.content}</p>
      )}
    </div>
  );
}

interface AssistantContentProps {
  entry: AssistantEntry;
  allEntries?: LogEntry[];
  projectName: string;
  sessionId: string;
  highlightedUuid?: string | null;
  autoExpandForUuid?: string | null;
}

export const AssistantContent = React.memo(function AssistantContent({ entry, allEntries, projectName, sessionId, highlightedUuid, autoExpandForUuid }: AssistantContentProps) {
  const { content } = entry.message;

  return (
    <div className="space-y-3">
      {content.map((block, i) => (
        <ContentBlockView key={i} block={block} allEntries={allEntries} projectName={projectName} sessionId={sessionId} highlightedUuid={highlightedUuid} autoExpandForUuid={autoExpandForUuid} />
      ))}
    </div>
  );
});

export const GenericContent = React.memo(function GenericContent({ entry }: { entry: GenericEntry }) {
  const summary = useMemo(() => {
    if (entry.type === "progress") {
      const data = entry.raw.data as Record<string, unknown> | undefined;
      const agentId = data?.agentId as string | undefined;
      const msgType = data?.type as string | undefined;
      return [msgType, agentId && `agent:${agentId}`]
        .filter(Boolean)
        .join(" | ");
    }
    if (entry.type === "file-history-snapshot") {
      return "File history snapshot";
    }
    return entry.type;
  }, [entry.type, entry.raw]);

  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{summary}</span>
      <details className="mt-1">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          Show raw JSON
        </summary>
        <pre className="mt-1 p-2 bg-muted/50 rounded text-xs whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
          {formatRaw(entry)}
        </pre>
      </details>
    </div>
  );
});
