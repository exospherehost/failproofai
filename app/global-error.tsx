"use client";

import { useEffect } from "react";
import { getTelemetryConfig } from "@/app/actions/get-telemetry-config";
import { setClientTelemetryConfig, captureClientEvent } from "@/lib/client-telemetry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    getTelemetryConfig()
      .then((cfg) => {
        setClientTelemetryConfig(cfg);
        captureClientEvent("client_error", {
          error_message: error.message,
          error_name: error.name,
          error_digest: error.digest,
          boundary: "global",
        });
      })
      .catch(() => {});
  }, [error]);

  return (
    <html>
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#031035",
            color: "#f8fafc",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "0.5rem",
              maxWidth: "500px",
            }}
          >
            <h2 style={{ color: "#ef4444", marginBottom: "0.5rem", fontSize: "1.25rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
              {error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.25rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
