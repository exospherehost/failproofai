/**
 * GlobalThis-backed registry for custom hooks.
 * Shared via globalThis so that the user's hook file (which imports customPolicies
 * from 'failproofai') and the hook handler (which reads from this file) share the
 * same in-process state when running within the same Node.js process.
 */
import type { CustomHook } from "./policy-types";

const REGISTRY_KEY = "__failproofai_custom_hooks__";

function getRegistry(): CustomHook[] {
  const g = globalThis as Record<string, unknown>;
  if (!Array.isArray(g[REGISTRY_KEY])) g[REGISTRY_KEY] = [];
  return g[REGISTRY_KEY] as CustomHook[];
}

export const customPolicies = {
  add(hook: CustomHook): void {
    getRegistry().push(hook);
  },
};

export function getCustomHooks(): CustomHook[] {
  return getRegistry();
}

export function clearCustomHooks(): void {
  const g = globalThis as Record<string, unknown>;
  g[REGISTRY_KEY] = [];
}
