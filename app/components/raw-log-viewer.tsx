/**
 * Raw Log Viewer — renders a parsed session log as a virtualized scrollable
 * list of timestamped entries (user messages, assistant responses, tool calls,
 * system events) with a summary stats bar at the top.
 */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, Wrench } from "lucide-react";
import type { LogEntry, ToolUseBlock } from "@/lib/log-entries";
import { StatsBar } from "@/app/components/log-viewer/stats-bar";
import { QueueDivider } from "@/app/components/log-viewer/queue-divider";
import { EntryRow } from "@/app/components/log-viewer/entry-row";
import { searchHookActivityAction } from "@/app/actions/get-hook-activity";
import type { HookActivityPayload } from "@/app/actions/get-hook-activity";
import SessionHooksPanel from "@/app/components/session-hooks-panel";

// ── Subagent metadata extraction ──

interface SubagentInfo {
  id: string;
  type: string;
  description: string;
}

function extractSubagents(entries: LogEntry[]): SubagentInfo[] {
  const seen = new Map<string, SubagentInfo>();
  for (const entry of entries) {
    if (entry.type !== "assistant") continue;
    for (const block of entry.message.content) {
      if (block.type === "tool_use" && block.name === "Task" && block.subagentId) {
        const tb = block as ToolUseBlock;
        if (!seen.has(tb.subagentId!)) {
          seen.set(tb.subagentId!, {
            id: tb.subagentId!,
            type: tb.subagentType || "unknown",
            description: tb.subagentDescription || "",
          });
        }
      }
    }
  }
  return Array.from(seen.values());
}


// ── Tool stats extraction ──

interface ToolStat {
  name: string;
  count: number;
  totalDurationMs: number;
}

function extractToolStats(entries: LogEntry[]): ToolStat[] {
  const map = new Map<string, { count: number; totalDurationMs: number }>();
  for (const entry of entries) {
    if (entry.type !== "assistant") continue;
    for (const block of entry.message.content) {
      if (block.type !== "tool_use") continue;
      if (block.name === "Task" && ((block as ToolUseBlock).subagentType || (block as ToolUseBlock).subagentId)) continue;
      const existing = map.get(block.name) || { count: 0, totalDurationMs: 0 };
      existing.count++;
      if ((block as ToolUseBlock).result?.durationMs) {
        existing.totalDurationMs += (block as ToolUseBlock).result!.durationMs;
      }
      map.set(block.name, existing);
    }
  }
  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);
}

function ToolStatsGrid({ tools, compact }: { tools: ToolStat[]; compact?: boolean }) {
  const gap = compact ? "gap-2" : "gap-3";
  return (
    <div className={`bg-card border border-border rounded-lg ${compact ? "p-3" : "p-4"}`}>
      <div className={`grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] ${gap}`}>
        {tools.map((tool) => (
          <div key={tool.name} className="flex items-center gap-2 min-w-0">
            <Wrench className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className={`${compact ? "text-xs" : "text-sm"} font-mono font-medium truncate`}>{tool.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {tool.count} call{tool.count !== 1 ? "s" : ""}
                {tool.totalDurationMs > 0 && ` · ${(tool.totalDurationMs / 1000).toFixed(1)}s`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Virtualized Entry List ──

interface VirtualizedEntryListProps {
  entries: LogEntry[];
  allEntries: LogEntry[];
  projectName: string;
  sessionId: string;
}

// Pixel-height estimates for the virtualizer's initial layout pass.
// Exact accuracy isn't required — the virtualizer measures real DOM heights
// after render and self-corrects, so these just need to be close enough to
// avoid large layout jumps on first paint.
function estimateSize(entry: LogEntry): number {
  switch (entry.type) {
    case "queue-operation":
      return 48;
    case "user":
      return 90;
    case "assistant":
      return 80 + entry.message.content.length * 120;
    default:
      return 100;
  }
}

type QueueOperationEntry = Extract<LogEntry, { type: "queue-operation" }>;

function getSegmentId(entry: QueueOperationEntry): string {
  return `${entry.uuid}-${entry.timestampMs}`;
}

/**
 * Walks the entries array and returns a Map from each queue-operation segment
 * to the count of non-queue-operation entries in its segment (entries after
 * it until the next queue-operation or end of list).
 */
function computeSegments(entries: LogEntry[]): Map<string, number> {
  const segments = new Map<string, number>();
  let currentId: string | null = null;
  let count = 0;

  for (const entry of entries) {
    if (entry.type === "queue-operation") {
      if (currentId !== null) {
        segments.set(currentId, count);
      }
      currentId = getSegmentId(entry);
      count = 0;
    } else if (currentId !== null) {
      count++;
    }
  }
  if (currentId !== null) {
    segments.set(currentId, count);
  }
  return segments;
}

function filterVisibleEntries(entries: LogEntry[], collapsedSessions: Set<string>): LogEntry[] {
  let currentCollapsed = false;
  return entries.filter((entry) => {
    if (entry.type === "queue-operation") {
      currentCollapsed = collapsedSessions.has(getSegmentId(entry as QueueOperationEntry));
      return true; // dividers are always visible
    }
    return !currentCollapsed;
  });
}

function parseHashUuid(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#entry-")) return hash.slice(7);
  return null;
}

/**
 * Build a map from subagent entry UUIDs to the parent session entry UUID
 * that contains the Task tool_use spawning that subagent.
 */
function buildSubagentUuidToParentMap(allEntries: LogEntry[]): Map<string, string> {
  // First, collect subagentId -> parent entry uuid
  const subagentIdToParentUuid = new Map<string, string>();
  for (const entry of allEntries) {
    if (entry.type !== "assistant" || !entry.uuid) continue;
    for (const block of entry.message.content) {
      if (block.type === "tool_use" && block.name === "Task" && block.subagentId) {
        subagentIdToParentUuid.set(block.subagentId, entry.uuid);
      }
    }
  }

  // Then, map each subagent entry uuid to the parent entry uuid
  const result = new Map<string, string>();
  for (const entry of allEntries) {
    if (!entry._source?.startsWith("agent-") || !entry.uuid) continue;
    const subagentId = entry._source.slice(6); // "agent-<id>" -> "<id>"
    const parentUuid = subagentIdToParentUuid.get(subagentId);
    if (parentUuid) result.set(entry.uuid, parentUuid);
  }
  return result;
}

function VirtualizedEntryList({ entries, allEntries, projectName, sessionId }: VirtualizedEntryListProps) {
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(new Set());
  const [scrollMargin, setScrollMargin] = useState(0);
  const [highlightedUuid, setHighlightedUuid] = useState<string | null>(() => parseHashUuid());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasScrolledRef = useRef(false);

  const listCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setScrollMargin(node.offsetTop);
  }, []);

  const segments = useMemo(() => computeSegments(entries), [entries]);

  const visibleEntries = useMemo(
    () => filterVisibleEntries(entries, collapsedSessions),
    [entries, collapsedSessions],
  );

  // UUID-to-index map for visible entries
  const uuidToIndex = useMemo(() => {
    const map = new Map<string, number>();
    visibleEntries.forEach((entry, i) => {
      if (entry.uuid) map.set(entry.uuid, i);
    });
    return map;
  }, [visibleEntries]);

  // Map subagent entry UUIDs to their parent session entry UUID
  const subagentUuidToParent = useMemo(
    () => buildSubagentUuidToParentMap(allEntries),
    [allEntries]
  );

  // Determine if hash targets a subagent entry
  const targetSubagentUuid = useMemo(() => {
    if (!highlightedUuid) return null;
    return subagentUuidToParent.has(highlightedUuid) ? highlightedUuid : null;
  }, [highlightedUuid, subagentUuidToParent]);

  const parentUuidForSubagent = targetSubagentUuid
    ? subagentUuidToParent.get(targetSubagentUuid) ?? null
    : null;

  // Set up auto-clear timer for initial highlight
  useEffect(() => {
    if (highlightedUuid) {
      highlightTimerRef.current = setTimeout(() => setHighlightedUuid(null), 4000);
      return () => { if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hash change listener (external event → setState in callback is fine)
  useEffect(() => {
    const onHashChange = () => {
      const uuid = parseHashUuid();
      setHighlightedUuid(uuid);
      hasScrolledRef.current = false;
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (uuid) {
        highlightTimerRef.current = setTimeout(() => setHighlightedUuid(null), 4000);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Auto-expand collapsed segments containing the target entry.
  // We compute the segment that needs uncollapsing and apply it via a
  // functional setState in a requestAnimationFrame to avoid the synchronous
  // setState-in-effect lint warning.
  const segmentToExpand = useMemo(() => {
    if (!highlightedUuid) return null;
    const lookupUuid = parentUuidForSubagent ?? highlightedUuid;
    const inEntries = entries.some(e => e.uuid === lookupUuid);
    const inVisible = uuidToIndex.has(lookupUuid);
    if (inEntries && !inVisible) {
      let currentSegmentId: string | null = null;
      for (const entry of entries) {
        if (entry.type === "queue-operation") {
          currentSegmentId = getSegmentId(entry);
        } else if (entry.uuid === lookupUuid && currentSegmentId) {
          return currentSegmentId;
        }
      }
    }
    return null;
  }, [highlightedUuid, parentUuidForSubagent, entries, uuidToIndex]);

  useEffect(() => {
    if (!segmentToExpand) return;
    const raf = requestAnimationFrame(() => {
      setCollapsedSessions(prev => {
        if (!prev.has(segmentToExpand)) return prev;
        const next = new Set(prev);
        next.delete(segmentToExpand);
        return next;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [segmentToExpand]);

  const handleToggleSegment = useCallback((uuid: string) => {
    setCollapsedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: visibleEntries.length,
    estimateSize: (index) => estimateSize(visibleEntries[index]),
    overscan: 5,
    scrollMargin,
  });

  // Scroll to highlighted entry
  useEffect(() => {
    if (!highlightedUuid || hasScrolledRef.current) return;
    const scrollToUuid = parentUuidForSubagent ?? highlightedUuid;
    const index = uuidToIndex.get(scrollToUuid);
    if (index == null) return;
    hasScrolledRef.current = true;
    requestAnimationFrame(() => {
      virtualizer.scrollToIndex(index, { align: "center" });
    });
  }, [highlightedUuid, parentUuidForSubagent, uuidToIndex, virtualizer]);

  return (
    <div ref={listCallbackRef}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = visibleEntries[virtualRow.index];
          const isTarget = !!highlightedUuid && entry.uuid === (parentUuidForSubagent ?? highlightedUuid);
          return (
            <div
              key={entry.type === "queue-operation" ? getSegmentId(entry) : (entry.uuid || entry.timestamp)}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              {entry.type === "queue-operation" ? (
                <QueueDivider
                  entry={entry}
                  isCollapsed={collapsedSessions.has(getSegmentId(entry))}
                  entryCount={segments.get(getSegmentId(entry)) ?? 0}
                  onToggle={() => handleToggleSegment(getSegmentId(entry))}
                />
              ) : (
                <EntryRow
                  entry={entry}
                  allEntries={allEntries}
                  projectName={projectName}
                  sessionId={sessionId}
                  isHighlighted={!targetSubagentUuid && isTarget}
                  highlightedUuid={targetSubagentUuid}
                  autoExpandForUuid={targetSubagentUuid}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ──

interface RawLogViewerProps {
  entries: LogEntry[];
  projectName: string;
  sessionId: string;
}

export default function RawLogViewer({ entries, projectName, sessionId }: RawLogViewerProps) {
  const sessionEntries = useMemo(
    () => entries.filter(e => e._source === "session"),
    [entries]
  );

  const subagents = useMemo(() => extractSubagents(entries), [entries]);

  const subagentEntriesMap = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const sa of subagents) {
      const source = `agent-${sa.id}`;
      map.set(sa.id, entries.filter(e => e._source === source));
    }
    return map;
  }, [entries, subagents]);

  const toolStats = useMemo(() => extractToolStats(sessionEntries), [sessionEntries]);

  const [subagentsCollapsed, setSubagentsCollapsed] = useState(false);
  const [collapsedSubagentIds, setCollapsedSubagentIds] = useState<Set<string>>(new Set());
  const [logsCollapsed, setLogsCollapsed] = useState(false);
  const [hookData, setHookData] = useState<HookActivityPayload | null>(null);

  useEffect(() => {
    searchHookActivityAction({ sessionId }, 1)
      .then((result) => {
        if (result.entries.length > 0) setHookData(result);
      })
      .catch(() => {});
  }, [sessionId]);

  // Auto-expand Logs section on hashchange with entry hash
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith("#entry-")) {
        setLogsCollapsed(false);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const toggleSubagent = useCallback((id: string) => {
    setCollapsedSubagentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <StatsBar entries={sessionEntries} />

      {hookData && (
        <SessionHooksPanel key={sessionId} sessionId={sessionId} initialData={hookData} />
      )}

      {subagents.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setSubagentsCollapsed(prev => !prev)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${subagentsCollapsed ? "-rotate-90" : ""}`} />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Subagents</span>
            <span className="text-xs text-muted-foreground">({subagents.length})</span>
          </button>
          {!subagentsCollapsed && subagents.map((sa) => (
            <div
              key={sa.id}
              className="pl-3 border-l-2 border-primary/30 space-y-2"
            >
              <button
                onClick={() => toggleSubagent(sa.id)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${collapsedSubagentIds.has(sa.id) ? "-rotate-90" : ""}`} />
                <span className="text-sm font-bold">{sa.type}</span>
                {sa.description && (
                  <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                    {sa.description}
                  </span>
                )}
              </button>
              {!collapsedSubagentIds.has(sa.id) && (
                <div className="space-y-2">
                  <StatsBar entries={subagentEntriesMap.get(sa.id) || []} compact />
                  {hookData && (
                    <SessionHooksPanel key={`hooks-${sa.id}`} sessionId={sessionId} initialData={hookData} />
                  )}
                  {(() => {
                    const saTools = extractToolStats(subagentEntriesMap.get(sa.id) || []);
                    return saTools.length > 0 ? <ToolStatsGrid tools={saTools} compact /> : null;
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toolStats.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tools</span>
            <span className="text-xs text-muted-foreground">({toolStats.reduce((s, t) => s + t.count, 0)})</span>
          </div>
          <ToolStatsGrid tools={toolStats} />
        </div>
      )}

      <div>
        <button
          onClick={() => setLogsCollapsed(prev => !prev)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${logsCollapsed ? "-rotate-90" : ""}`} />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Logs</span>
        </button>
        {!logsCollapsed && (
          <div className="mt-2 bg-card border border-border rounded-lg p-4 shadow-sm">
            {sessionEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No entries found.
              </p>
            ) : (
              <VirtualizedEntryList
                entries={sessionEntries}
                allEntries={entries}
                projectName={projectName}
                sessionId={sessionId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
