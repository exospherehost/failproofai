// @vitest-environment node
/**
 * Integration test for the custom-hooks-loader real load path.
 *
 * Unlike custom-hooks-loader.test.ts (which mocks loader-utils and the registry),
 * this test writes a real temp .mjs fixture and exercises the full import path.
 * The fixture avoids 'failproofai' imports so ESM rewriting is a no-op.
 */
import { describe, it, expect, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCustomHooks } from "../../src/hooks/custom-hooks-loader";

const REGISTRY_KEY = "__failproofai_custom_hooks__";

function clearRegistry(): void {
  (globalThis as Record<string, unknown>)[REGISTRY_KEY] = undefined;
}

describe("custom-hooks-loader (integration)", () => {
  const createdFiles: string[] = [];

  afterEach(() => {
    clearRegistry();
    for (const f of createdFiles.splice(0)) {
      if (existsSync(f)) unlinkSync(f);
    }
  });

  it("loads and returns a hook registered via globalThis from a real .mjs fixture", async () => {
    const hooksFile = join(tmpdir(), `failproofai-test-hooks-${Date.now()}.mjs`);
    const rewrittenFile = hooksFile.replace(".mjs", ".__failproofai_tmp__.mjs");
    createdFiles.push(hooksFile, rewrittenFile);

    // Fixture pushes directly to the globalThis registry — no 'failproofai' import needed,
    // so loader-utils rewriting is a no-op and the test does not depend on dist being built.
    const fixture = [
      `const KEY = "__failproofai_custom_hooks__";`,
      `if (!Array.isArray(globalThis[KEY])) globalThis[KEY] = [];`,
      `globalThis[KEY].push({ name: "integration-hook", fn: async () => ({ decision: "allow" }) });`,
    ].join("\n");

    writeFileSync(hooksFile, fixture, "utf8");

    clearRegistry(); // ensure clean state before load

    const result = await loadCustomHooks(hooksFile);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("integration-hook");
    expect(typeof result[0].fn).toBe("function");
  });
});
