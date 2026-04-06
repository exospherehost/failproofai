/** Session-level error boundary — catches errors parsing session logs. */
"use client";
import ErrorFallback from "@/app/components/error-fallback";

export default function SessionError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} heading="Failed to load session" defaultMessage="An unexpected error occurred while reading the session log." />;
}
