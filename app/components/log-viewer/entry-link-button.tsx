"use client";

import { useCallback } from "react";
import { Link2 } from "lucide-react";
import { toast } from "@/app/components/toast";

interface EntryLinkButtonProps {
  uuid: string;
}

export function EntryLinkButton({ uuid }: EntryLinkButtonProps) {
  const handleClick = useCallback(async () => {
    window.history.replaceState(null, "", `#entry-${uuid}`);
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    toast("Link copied");
  }, [uuid]);

  return (
    <button
      onClick={handleClick}
      title="Copy link to entry"
      className="inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Link2 className="w-3.5 h-3.5" />
    </button>
  );
}
