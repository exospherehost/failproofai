import { describe, it } from "vitest";
import { createFixtureEnv } from "../helpers/fixture-env";
import { INTEGRATION_ADAPTERS } from "../helpers/integration-adapter";
import { runHook } from "../helpers/hook-runner";

describe("e2e matrix: customPoliciesPath + allowPatterns across all CLIs", () => {
  for (const adapter of INTEGRATION_ADAPTERS) {
    describe(adapter.id, () => {
      it("customPoliciesPath hook can deny PreToolUse", () => {
        const env = createFixtureEnv();
        const hookPath = env.writeHook("deny-all.mjs", `
          import { customPolicies, deny } from "failproofai";
          customPolicies.add({
            name: "custom-deny-all",
            description: "deny everything",
            match: { events: ["PreToolUse"] },
            fn: async () => deny("blocked by custom matrix policy"),
          });
        `);

        env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });

        const result = runHook(
          adapter.preToolHookArg,
          adapter.makePreToolUsePayload("ls -la", env.cwd),
          { homeDir: env.home, cli: adapter.id, cwd: env.cwd },
        );

        adapter.assertDeny(result);
      });

      it("non-existent customPoliciesPath fails open (allow, no crash)", () => {
        const env = createFixtureEnv();
        env.writeConfig({
          enabledPolicies: [],
          customPoliciesPath: `${env.cwd}/.hooks/not-found.mjs`,
        });

        const result = runHook(
          adapter.preToolHookArg,
          adapter.makePreToolUsePayload("ls -la", env.cwd),
          { homeDir: env.home, cli: adapter.id, cwd: env.cwd },
        );

        adapter.assertAllow(result);
      });

      it("block-sudo allowPatterns allows matching command", () => {
        const env = createFixtureEnv();
        env.writeConfig({
          enabledPolicies: ["block-sudo"],
          policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl status *"] } },
        });

        const result = runHook(
          adapter.preToolHookArg,
          adapter.makePreToolUsePayload("sudo systemctl status nginx", env.cwd),
          { homeDir: env.home, cli: adapter.id, cwd: env.cwd },
        );

        adapter.assertAllow(result);
      });

      it("block-sudo allowPatterns denies non-matching sudo command", () => {
        const env = createFixtureEnv();
        env.writeConfig({
          enabledPolicies: ["block-sudo"],
          policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl status *"] } },
        });

        const result = runHook(
          adapter.preToolHookArg,
          adapter.makePreToolUsePayload("sudo rm -rf /tmp/matrix", env.cwd),
          { homeDir: env.home, cli: adapter.id, cwd: env.cwd },
        );

        adapter.assertDeny(result);
      });
    });
  }
});

describe("e2e: customPoliciesPath precedence across config scopes", () => {
  const claude = INTEGRATION_ADAPTERS.find((a) => a.id === "claude-code")!;

  it("local customPoliciesPath takes precedence over global", () => {
    const env = createFixtureEnv();
    const globalHookPath = env.writeHook("global-deny.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "global-deny",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("global"),
      });
    `);
    const localHookPath = env.writeHook("local-allow.mjs", `
      import { customPolicies, allow } from "failproofai";
      customPolicies.add({
        name: "local-allow",
        match: { events: ["PreToolUse"] },
        fn: async () => allow(),
      });
    `);

    env.writeConfig({ enabledPolicies: [], customPoliciesPath: globalHookPath }, "global");
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: localHookPath }, "local");

    const result = runHook(
      claude.preToolHookArg,
      claude.makePreToolUsePayload("ls -la", env.cwd),
      { homeDir: env.home, cli: claude.id, cwd: env.cwd },
    );

    claude.assertAllow(result);
  });

  it("project customPoliciesPath takes precedence over local", () => {
    const env = createFixtureEnv();
    const localHookPath = env.writeHook("local-deny.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "local-deny",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("local"),
      });
    `);
    const projectHookPath = env.writeHook("project-allow.mjs", `
      import { customPolicies, allow } from "failproofai";
      customPolicies.add({
        name: "project-allow",
        match: { events: ["PreToolUse"] },
        fn: async () => allow(),
      });
    `);

    env.writeConfig({ enabledPolicies: [], customPoliciesPath: localHookPath }, "local");
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: projectHookPath }, "project");

    const result = runHook(
      claude.preToolHookArg,
      claude.makePreToolUsePayload("ls -la", env.cwd),
      { homeDir: env.home, cli: claude.id, cwd: env.cwd },
    );

    claude.assertAllow(result);
  });
});
