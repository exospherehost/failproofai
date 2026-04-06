/** Project-level error boundary — catches errors loading session files. */
"use client";
import ErrorFallback from "@/app/components/error-fallback";

export default function ProjectError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} heading="Failed to load project" defaultMessage="An unexpected error occurred while loading this project." />;
}
