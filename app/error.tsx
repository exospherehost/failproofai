/** Root-level error boundary — catches unhandled errors on the home page. */
"use client";
import ErrorFallback from "@/app/components/error-fallback";

export default function HomeError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} heading="Something went wrong" defaultMessage="An unexpected error occurred while loading projects." />;
}
