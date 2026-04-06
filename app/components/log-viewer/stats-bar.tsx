import React, { useMemo } from "react";
import {
  User,
  Bot,
  Cpu,
  Clock,
  MessageSquare,
  Workflow,
  Wrench,
} from "lucide-react";
import type { LogEntry } from "@/lib/log-entries";
import { calculateLogStats } from "@/lib/log-stats";

interface StatsBarProps {
  entries: LogEntry[];
  compact?: boolean;
}

export const StatsBar = React.memo(function StatsBar({ entries, compact = false }: StatsBarProps) {
  const stats = useMemo(() => calculateLogStats(entries), [entries]);
  const icon = compact ? "w-3.5 h-3.5" : "w-4 h-4";
  const value = compact ? "text-xs font-medium" : "text-sm font-medium";
  const label = compact ? "text-[10px] text-muted-foreground" : "text-xs text-muted-foreground";

  const items = [
    ...(!compact ? [{ Icon: MessageSquare, color: "text-primary", v: stats.turnCount, l: "Turns" }] : []),
    { Icon: User, color: "text-[color:var(--chart-1)]", v: stats.userCount, l: "User" },
    { Icon: Bot, color: "text-[color:var(--chart-2)]", v: stats.assistantCount, l: "Assistant" },
    { Icon: Wrench, color: "text-[color:var(--chart-3)]", v: stats.toolCallCount, l: compact ? "Tools" : "Tool Calls" },
    { Icon: Workflow, color: "text-[color:var(--chart-5)]", v: stats.subagentCount, l: "Subagents" },
    { Icon: Clock, color: "text-[color:var(--chart-4)]", v: stats.duration || "\u2014", l: "Duration" },
    { Icon: Cpu, color: "text-[color:var(--chart-5)]", v: stats.models.length > 0 ? stats.models.join(", ") : "\u2014", l: compact ? "Model" : "Model(s)" },
  ];

  return (
    <div className={compact ? "bg-muted/30 border border-border/50 rounded-lg p-3 mb-3" : "bg-card border border-border rounded-lg p-4"}>
      <div className={`grid grid-cols-2 ${compact ? `sm:grid-cols-6 gap-3` : `sm:grid-cols-4 lg:grid-cols-7 gap-4`}`}>
        {items.map(({ Icon, color, v, l }) => (
          <div key={l} className="flex items-center gap-2">
            <Icon className={`${icon} ${color}`} />
            <div>
              <div className={`${value} truncate max-w-[120px]`}>{v}</div>
              <div className={label}>{l}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
