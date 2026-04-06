/**
 * Next.js instrumentation hook — runs once on server startup.
 * Delegates to instrumentation.node.ts which is dynamically imported only
 * when running in the Node.js runtime, so Edge compilation never sees Node.js APIs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { registerNode } = await import("./instrumentation.node");
  await registerNode();
}
