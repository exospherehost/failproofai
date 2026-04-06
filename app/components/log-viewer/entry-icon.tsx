import {
  User,
  Bot,
  FileText,
  Activity,
  Settings,
  Play,
} from "lucide-react";
import type { LogEntryType } from "@/lib/log-entries";

export function EntryIcon({ type }: { type: LogEntryType }) {
  const className = "w-4 h-4";
  switch (type) {
    case "user":
      return <User className={className} />;
    case "assistant":
      return <Bot className={className} />;
    case "file-history-snapshot":
      return <FileText className={className} />;
    case "progress":
      return <Activity className={className} />;
    case "system":
      return <Settings className={className} />;
    case "queue-operation":
      return <Play className={className} />;
  }
}
