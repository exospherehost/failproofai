import React from "react";

export interface IntegrationBadgeProps {
  integration?: string;
  className?: string;
}

export const INTEGRATION_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  "claude-code": { label: "Claude", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "cursor": { label: "Cursor", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  "gemini": { label: "Gemini", bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  "copilot": { label: "Copilot", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "codex": { label: "Codex", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  "opencode": { label: "OpenCode", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "pi": { label: "Pi", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  "virtual": { label: "Virtual", bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
};

export function IntegrationBadge({ integration, className = "" }: IntegrationBadgeProps) {
  const style = INTEGRATION_STYLES[integration || "claude-code"] || { 
    label: integration || "Claude", 
    bg: "bg-primary/10", 
    text: "text-primary", 
    border: "border-primary/20" 
  };
  
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-bold tracking-tight uppercase ${style.bg} ${style.text} ${style.border} border ${className}`}>
      {style.label}
    </span>
  );
}
