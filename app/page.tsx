import { notFound } from "next/navigation";

// All redirects are handled by proxy middleware.
// This page is only reached when all pages are disabled.
export default function Home() {
  notFound();
}
