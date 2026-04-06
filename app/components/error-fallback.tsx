"use client";

import { useEffect } from "react";
import { captureClientEvent } from "@/lib/client-telemetry";

export default function ErrorFallback({
  error,
  reset,
  heading,
  defaultMessage,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  heading: string;
  defaultMessage: string;
}) {
  useEffect(() => {
    captureClientEvent("client_error", {
      error_message: error.message,
      error_name: error.name,
      error_digest: error.digest,
    });
  }, [error]);
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="bg-card text-card-foreground rounded-lg border border-destructive/50 p-6 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">{heading}</h2>
          <p className="text-muted-foreground mb-4">
            {error.message || defaultMessage}
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
