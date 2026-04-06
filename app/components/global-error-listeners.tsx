"use client";

import { useEffect } from "react";
import { captureClientEvent } from "@/lib/client-telemetry";

export function GlobalErrorListeners() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureClientEvent("unhandled_exception", {
        error_message: event.message,
        error_name: event.error?.name,
        error_filename: event.filename,
        error_lineno: event.lineno,
        error_colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      captureClientEvent("unhandled_rejection", {
        error_message: reason instanceof Error ? reason.message : String(reason),
        error_name: reason instanceof Error ? reason.name : undefined,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
