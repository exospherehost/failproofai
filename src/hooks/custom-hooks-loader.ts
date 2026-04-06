/**
 * Loads a user-authored hooks.js file with ESM import rewriting.
 * Supports transitive local imports and `import { ... } from 'failproofai'`.
 *
 * Fail-open: any error (file not found, syntax error, import failure) is logged
 * and results in an empty hook list. Builtins continue running normally.
 */
import { resolve, isAbsolute } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { hookLogWarn, hookLogError } from "./hook-logger";
import { getCustomHooks, clearCustomHooks } from "./custom-hooks-registry";
import { findDistIndex, rewriteFileTree, TMP_SUFFIX, cleanupTmpFiles } from "./loader-utils";
import type { CustomHook } from "./policy-types";

const LOADING_KEY = "__FAILPROOFAI_LOADING_HOOKS__";

export async function loadCustomHooks(
  customHooksPath: string | undefined,
  opts?: { strict?: boolean },
): Promise<CustomHook[]> {
  if (!customHooksPath) return [];

  const absPath = isAbsolute(customHooksPath)
    ? customHooksPath
    : resolve(process.cwd(), customHooksPath);

  if (!existsSync(absPath)) {
    if (opts?.strict) throw new Error(`Custom hooks file not found: ${absPath}`);
    hookLogWarn(`customHooksPath not found: ${absPath}`);
    return [];
  }

  // Clear registry before loading so each invocation starts fresh
  clearCustomHooks();

  const g = globalThis as Record<string, unknown>;
  g[LOADING_KEY] = true;

  let tmpFiles: string[] = [];
  try {
    const distIndex = await findDistIndex();
    const distUrl = distIndex ? pathToFileURL(distIndex).href : null;

    tmpFiles = await rewriteFileTree(absPath, distUrl, distIndex);

    const entryTmp = absPath + TMP_SUFFIX;
    const fileUrl = pathToFileURL(entryTmp).href;
    await import(/* webpackIgnore: true */ fileUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (opts?.strict) throw new Error(`Failed to load custom hooks from ${absPath}: ${msg}`);
    hookLogError(`failed to load custom hooks from ${absPath}: ${msg}`);
    return [];
  } finally {
    g[LOADING_KEY] = false;
    await cleanupTmpFiles(tmpFiles);
  }

  return getCustomHooks();
}
