"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function fallbackCopyText(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  try {
    textarea.select();
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!fallbackCopyText(text)) {
        throw new Error("Both clipboard methods failed");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Try fallback if the modern API threw
      try {
        if (fallbackCopyText(text)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        // Both methods failed — do nothing
      }
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className={cn(
        "inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors",
        className
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
