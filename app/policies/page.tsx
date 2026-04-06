/** Policies page — thin server component wrapper for Suspense boundary. */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import HooksClient from "./hooks-client";

export const dynamic = "force-dynamic";

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const disabled = (process.env.FAILPROOFAI_DISABLE_PAGES ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (disabled.includes("policies")) notFound();

  const { tab } = await searchParams;
  const initialTab = tab === "policies" ? "policies" : "activity";
  return (
    <Suspense>
      <HooksClient initialTab={initialTab} />
    </Suspense>
  );
}
