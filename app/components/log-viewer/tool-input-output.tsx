import { useMemo } from "react";
import type { ToolUseBlock } from "@/lib/log-entries";
import { formatInput, formatLocalTimestamp } from "@/lib/log-format";
import { CopyButton } from "@/app/components/copy-button";

export function ToolInputOutput({ block }: { block: ToolUseBlock }) {
  const inputText = useMemo(() => formatInput(block), [block]);

  return (
    <div className="space-y-2">
      <details open>
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <span className="inline-flex items-center gap-1">
            Input
            <CopyButton text={inputText} />
          </span>
        </summary>
        <pre className="mt-1 p-2 bg-muted/50 rounded text-xs whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
          {inputText}
        </pre>
      </details>
      {block.result ? (
        <div className="border-l-2 border-primary/50 pl-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 text-xs font-mono rounded border bg-primary/20 text-primary border-primary/30">
              Result
            </span>
            <span className="text-xs text-muted-foreground">
              {formatLocalTimestamp(new Date(block.result.timestamp).getTime())}
            </span>
          </div>
          {block.result.content && (
            <details open>
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <span className="inline-flex items-center gap-1">
                  Output
                  <CopyButton text={block.result.content} />
                </span>
              </summary>
              <pre className="mt-1 p-2 bg-muted/50 rounded text-xs whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {block.result.content}
              </pre>
            </details>
          )}
          {block.result.images?.map((img, i) => (
            <img
              key={i}
              src={`data:${img.mediaType};base64,${img.base64}`}
              alt={`Tool result image ${i + 1}`}
              className="mt-2 max-w-full rounded border border-border"
            />
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          Tool did not return a result
        </div>
      )}
    </div>
  );
}
