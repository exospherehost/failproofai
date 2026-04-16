/**
 * Install/remove/list failproofai hooks in Claude Code or Cursor settings.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { homedir, platform, arch, release, hostname } from "node:os";
import {
  type HookScope,
  type IntegrationType,
} from "./types";
import { promptPolicySelection } from "./install-prompt";
import {
  readMergedHooksConfig,
  readScopedHooksConfig,
  writeScopedHooksConfig,
  getConfigPathForScope,
} from "./hooks-config";
import type { HooksConfig } from "./policy-types";
import { BUILTIN_POLICIES } from "./builtin-policies";
import { loadCustomHooks, discoverPolicyFiles } from "./custom-hooks-loader";
import { trackHookEvent } from "./hook-telemetry";
import { getInstanceId, hashToId } from "../../lib/telemetry-id";
import { CliError } from "../cli-error";
import { getIntegration, type Integration } from "./integrations";

const VALID_POLICY_NAMES = new Set(BUILTIN_POLICIES.map((p) => p.name));

export function getSettingsPath(
  scope: HookScope | "repo",
  cwd?: string,
  integration: IntegrationType = "claude-code",
): string {
  return getIntegration(integration).getSettingsPath(scope as any, cwd);
}

export function hooksInstalledInSettings(
  scope: HookScope | "repo",
  cwd?: string,
  integration: IntegrationType = "claude-code",
): boolean {
  return getIntegration(integration).hooksInstalledInSettings(scope as any, cwd);
}

/**
 * Resolve the path to the failproofai binary.
 */
function resolveFailproofaiBinary(): string {
  // Use FAILPROOFAI_DIST_PATH if provided (for development/testing)
  if (process.env.FAILPROOFAI_DIST_PATH) {
    const distBin = resolve(process.env.FAILPROOFAI_DIST_PATH, "bin", "failproofai.mjs");
    if (existsSync(distBin)) return distBin;

    const distCli = resolve(process.env.FAILPROOFAI_DIST_PATH, "cli.mjs");
    if (existsSync(distCli)) return distCli;

    const rootBin = resolve(process.env.FAILPROOFAI_DIST_PATH, "..", "bin", "failproofai.mjs");
    if (existsSync(rootBin)) return rootBin;
  }
  // Try finding it relative to this file (in dist or src)
  const relativeDist = resolve(__dirname, "..", "cli.mjs");
  if (existsSync(relativeDist)) return relativeDist;

  const relativeSrc = resolve(__dirname, "..", "..", "bin", "failproofai.mjs");
  if (existsSync(relativeSrc)) return relativeSrc;

  // Fall back to whichever global binary is in PATH
  try {
    const cmd = process.platform === "win32" ? "where failproofai" : "which failproofai";
    const result = execSync(cmd, { encoding: "utf8" }).trim();
    return result.split("\n")[0].trim();
  } catch {
    throw new CliError(
      "failproofai binary not found in PATH.\n" +
      "Install it globally first: npm install -g failproofai",
    );
  }
}

function scopeLabel(integration: Integration, scope: string, cwd?: string): string {
  const settingsPath = integration.getSettingsPath(scope as any, cwd);
  const homeDir = homedir();
  const baseDir = cwd ? resolve(cwd) : process.cwd();

  if (settingsPath.startsWith(`${homeDir}/`)) {
    return `~/${settingsPath.slice(homeDir.length + 1)}`;
  }
  if (settingsPath.startsWith(`${baseDir}/`)) {
    return `{cwd}/${settingsPath.slice(baseDir.length + 1)}`;
  }
  return settingsPath;
}

function assertSupportedScope(integration: Integration, scope: string): void {
  if (!integration.scopes.includes(scope)) {
    throw new CliError(
      `Scope "${scope}" is not supported for ${integration.displayName}. ` +
      `Supported scopes: ${integration.scopes.join(", ")}`,
    );
  }
}

/** Return only scopes whose settings paths are unique (first wins). */
function deduplicateScopes(
  integration: Integration,
  scopes: readonly string[],
  cwd?: string,
): string[] {
  const paths = new Set<string>();
  const result: string[] = [];
  for (const s of scopes) {
    const p = integration.getSettingsPath(s as any, cwd);
    if (!paths.has(p)) {
      paths.add(p);
      result.push(s);
    }
  }
  return result;
}

function validatePolicyNames(names: string[]): void {
  const unknown = names.filter((n) => !VALID_POLICY_NAMES.has(n));
  if (unknown.length > 0) {
    const list = [...VALID_POLICY_NAMES].sort().join(", ");
    throw new CliError(`Unknown policy name(s): ${unknown.join(", ")}\nValid policies: ${list}`);
  }
}

export async function installHooks(
  policyNames?: string[],
  scope: HookScope | "repo" = "user",
  cwd?: string,
  includeBeta = false,
  source?: string,
  customPoliciesPath?: string,
  removeCustomHooks = false,
  integration: IntegrationType = "claude-code",
): Promise<void> {
  const integ = getIntegration(integration);
  assertSupportedScope(integ, scope);

  const binaryPath = resolveFailproofaiBinary();

  // Capture existing config before overwriting (used for telemetry diff)
  const previousConfig = readScopedHooksConfig(scope as HookScope, cwd);
  const previousEnabled = new Set(previousConfig.enabledPolicies);

  // Validate user input first before any system checks
  if (policyNames !== undefined && policyNames.length > 0) {
    const nonAllNames = policyNames.filter((n) => n !== "all");
    if (nonAllNames.length > 0) validatePolicyNames(nonAllNames);
    if (policyNames.includes("all") && nonAllNames.length > 0) {
      throw new CliError(
        `"all" cannot be combined with specific policy names.\n` +
        `Use either: --install all  or  --install block-sudo sanitize-jwt ...`
      );
    }
  }

  let selectedPolicies: string[];

  if (policyNames !== undefined) {
    // Non-interactive path
    let incoming: string[];
    if (policyNames.length === 1 && policyNames[0] === "all") {
      incoming = BUILTIN_POLICIES
        .filter((p) => includeBeta || !p.beta)
        .map((p) => p.name);
    } else {
      incoming = policyNames;
    }
    // Additive
    selectedPolicies = [...new Set([...previousConfig.enabledPolicies, ...incoming])];
  } else {
    // Interactive
    const preSelected = previousConfig.enabledPolicies.length > 0 ? previousConfig.enabledPolicies : undefined;
    selectedPolicies = await promptPolicySelection(preSelected, { includeBeta });
  }

  // Preserve existing config fields (policyParams, customPoliciesPath, llm) when updating
  const configToWrite = { ...previousConfig, enabledPolicies: selectedPolicies };
  if (removeCustomHooks) {
    delete configToWrite.customPoliciesPath;
  } else if (customPoliciesPath) {
    configToWrite.customPoliciesPath = resolve(customPoliciesPath);
    // Validate the file before committing it to config
    let validatedHooks: Awaited<ReturnType<typeof loadCustomHooks>> = [];
    try {
      validatedHooks = await loadCustomHooks(configToWrite.customPoliciesPath, { strict: true });
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
    if (validatedHooks.length === 0) {
      console.error(`Error: no hooks registered in ${customPoliciesPath}.`);
      process.exit(1);
    }
    console.log(`\nValidated ${validatedHooks.length} custom hook(s): ${validatedHooks.map((h) => h.name).join(", ")}`);
  }

  writeScopedHooksConfig(configToWrite, scope as HookScope, cwd);
  console.log(`\nEnabled ${selectedPolicies.length} policy(ies): ${selectedPolicies.join(", ")}`);

  const settingsPath = integ.getSettingsPath(scope as any, cwd);
  const settings = integ.readSettings(settingsPath);
  integ.writeHookEntries(settings, binaryPath, scope);
  integ.writeSettings(settingsPath, settings);
  integ.postInstall?.();

  if (!settings.hooks) {
    settings.hooks = {};
  }

  for (const eventType of HOOK_EVENT_TYPES) {
    const command = scope === "project"
      ? `npx -y failproofai --hook ${eventType}`
      : `"${binaryPath}" --hook ${eventType}`;
    const hookEntry: ClaudeHookEntry = {
      type: "command",
      command,
      timeout: 60_000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };

    if (!settings.hooks[eventType]) {
      settings.hooks[eventType] = [];
    }

    const matchers: ClaudeHookMatcher[] = settings.hooks[eventType];

    // Find existing failproofai matcher
    let found = false;
    for (const matcher of matchers) {
      if (!matcher.hooks) continue;
      const failproofaiIdx = matcher.hooks.findIndex((h: ClaudeHookEntry | Record<string, unknown>) =>
        isFailproofaiHook(h as Record<string, unknown>)
      );
      if (failproofaiIdx >= 0) {
        matcher.hooks[failproofaiIdx] = hookEntry;
        found = true;
        break;
      }
    }

    if (!found) {
      // Append a new matcher with the failproofai hook
      matchers.push({ hooks: [hookEntry] });
    }
  }

  writeSettings(settingsPath, settings);

  // Telemetry: track successful hook installation (with diff vs previous config)
  try {
    const newSet = new Set(selectedPolicies);
    const policiesAdded = selectedPolicies.filter((p) => !previousEnabled.has(p));
    const policiesRemoved = [...previousEnabled].filter((p) => !newSet.has(p));
    const distinctId = getInstanceId();
    await trackHookEvent(distinctId, "hooks_installed", {
      scope,
      integration,
      policies: selectedPolicies,
      policy_count: selectedPolicies.length,
      policies_added: policiesAdded,
      policies_removed: policiesRemoved,
      ...(source ? { source } : {}),
      platform: platform(),
      arch: arch(),
      os_release: release(),
      hostname_hash: hashToId(hostname()),
      has_custom_hooks_path: !!(configToWrite.customPoliciesPath),
      has_policy_params: !!(configToWrite.policyParams && Object.keys(configToWrite.policyParams).length > 0),
      param_policy_names: configToWrite.policyParams ? Object.keys(configToWrite.policyParams) : [],
      command_format: scope === "project" ? "npx" : "absolute",
    });
  } catch { /* best effort */ }

  console.log(`Failproof AI hooks installed for all ${integ.eventTypes.length} event types (scope: ${scope}).`);
  console.log(`Settings: ${settingsPath}`);
  // claude-code and copilot project-scope hooks use npx — no machine-specific paths.
  // Other integrations embed absolute binary paths even in project scope.
  const isPortableProjectInstall = scope === "project" &&
    (integration === "claude-code" || integration === "copilot");
  if (scope === "project" && integration === "claude-code") {
    console.log(`Command:  npx -y failproofai`);
  }
  if (isPortableProjectInstall) {
    console.log(`\nThis file can be committed to git — no machine-specific paths.`);
  } else {
    console.log(`Binary:   ${binaryPath}`);
  }

  // Warn about duplicate-scope installations
  const otherScopes = deduplicateScopes(integ, integ.scopes, cwd).filter((s) => s !== scope);
  const duplicates = otherScopes.filter((s) => integ.hooksInstalledInSettings(s as any, cwd));
  if (duplicates.length > 0) {
    const scopeList = duplicates.map((s) => `${s} (${scopeLabel(integ, s, cwd)})`).join(", ");
    console.log();
    console.log(`\x1B[33mWarning: Failproof AI hooks are also installed at ${scopeList}.\x1B[0m`);
    console.log(`Having hooks in multiple scopes may cause duplicate policy evaluation.`);
    console.log(`Use \`failproofai policies --uninstall --scope ${duplicates[0]}\` to remove the other installation,`);
    console.log(`or \`failproofai policies\` to see all scopes.`);
  }
}

export async function removeHooks(
  policyNames?: string[],
  scope: HookScope | "repo" | "all" = "user",
  cwd?: string,
  opts?: { betaOnly?: boolean; source?: string; removeCustomHooks?: boolean; integration?: IntegrationType },
  integration: IntegrationType = "claude-code",
): Promise<void> {
  const integ = getIntegration(opts?.integration ?? integration);
  const configScope: HookScope = scope === "all" ? "user" : (scope as HookScope);

  // Clear custom hooks path if requested
  if (opts?.removeCustomHooks) {
    const config = readScopedHooksConfig(configScope, cwd);
    delete config.customPoliciesPath;
    writeScopedHooksConfig(config, configScope, cwd);
    console.log("Custom hooks path cleared.");
  }

  // Remove specific policies from config (keep hooks installed)
  if (policyNames && policyNames.length > 0 && !(policyNames.length === 1 && policyNames[0] === "all")) {
    validatePolicyNames(policyNames);
    const config = readScopedHooksConfig(configScope, cwd);
    const removeSet = new Set(policyNames);
    const remaining = config.enabledPolicies.filter((p) => !removeSet.has(p));
    const notEnabled = policyNames.filter((p) => !config.enabledPolicies.includes(p));
    if (notEnabled.length > 0) {
      console.log(`Warning: policy(ies) not currently enabled: ${notEnabled.join(", ")}`);
    }
    const { policyParams: existingParams, ...baseConfig } = config;
    const filteredParams = existingParams
      ? Object.fromEntries(Object.entries(existingParams).filter(([k]) => !removeSet.has(k)))
      : null;
    const updatedConfig: HooksConfig = {
      ...baseConfig,
      enabledPolicies: remaining,
      ...(filteredParams && Object.keys(filteredParams).length > 0 ? { policyParams: filteredParams } : {}),
    };
    writeScopedHooksConfig(updatedConfig, configScope, cwd);

    // Telemetry
    try {
      const distinctId = getInstanceId();
      const actuallyRemoved = policyNames.filter((p) => config.enabledPolicies.includes(p));
      await trackHookEvent(distinctId, "hooks_removed", {
        scope,
        integration: integ.id,
        removal_mode: opts?.betaOnly ? "beta_policies" : "policies",
        beta_only: opts?.betaOnly ?? false,
        policies_removed: actuallyRemoved,
        removed_count: actuallyRemoved.length,
        ...(opts?.source ? { source: opts.source } : {}),
        platform: platform(),
        arch: arch(),
        os_release: release(),
        hostname_hash: hashToId(hostname()),
      });
    } catch { /* best effort */ }

    console.log(`Disabled ${policyNames.length - notEnabled.length} policy(ies).`);
    console.log(`Remaining: ${remaining.length > 0 ? remaining.join(", ") : "(none)"}`);
    return;
  }

  // Capture enabled policies before clearing (used for accurate telemetry below)
  const configBeforeRemoval = readScopedHooksConfig(configScope, cwd);

  if (scope !== "all") {
    assertSupportedScope(integ, scope);
  }

  // Remove all failproofai hooks from the selected integration's settings
  const scopesToRemove = scope === "all" ? [...integ.scopes] : [scope];
  let totalRemoved = 0;

  for (const s of scopesToRemove) {
    const settingsPath = integ.getSettingsPath(s as any, cwd);
    if (!existsSync(settingsPath)) continue;

    const removed = integ.removeHooksFromFile(settingsPath);
    totalRemoved += removed;

    if (scope !== "all") {
      console.log(`Removed ${removed} failproofai hook(s) from settings.`);
      console.log(`Settings: ${settingsPath}`);
    }
  }

  if (scope === "all") {
    console.log(`Removed ${totalRemoved} failproofai hook(s) from all scopes.`);
  }

  // Telemetry
  try {
    const distinctId = getInstanceId();
    await trackHookEvent(distinctId, "hooks_removed", {
      scope,
      integration: integ.id,
      removal_mode: "hooks",
      policies_removed: configBeforeRemoval.enabledPolicies,
      removed_count: totalRemoved,
      ...(opts?.source ? { source: opts.source } : {}),
      platform: platform(),
      arch: arch(),
      os_release: release(),
      hostname_hash: hashToId(hostname()),
    });
  } catch { /* best effort */ }

  // Clear policy config when removing from all scopes, or when no hooks remain in any scope
  if (scope === "all") {
    for (const s of integ.scopes) {
      if (s === "repo") continue;
      const existing = readScopedHooksConfig(s as HookScope, cwd);
      if (existing.enabledPolicies.length > 0) {
        writeScopedHooksConfig({ ...existing, enabledPolicies: [] }, s as HookScope, cwd);
      }
    }
  } else if (!integ.scopes.some((s) => integ.hooksInstalledInSettings(s as any, cwd))) {
    writeScopedHooksConfig({ ...configBeforeRemoval, enabledPolicies: [] }, configScope, cwd);
  }
}

export async function listHooks(
  cwd?: string,
  integration: IntegrationType = "claude-code",
): Promise<void> {
  const integ = getIntegration(integration);
  // Multi-scope config is merged for listing
  const config = readMergedHooksConfig(cwd);
  const enabledSet = new Set(config.enabledPolicies);

  const uniqueScopes = deduplicateScopes(integ, integ.scopes, cwd);
  const installedScopes = uniqueScopes.filter((s) => integ.hooksInstalledInSettings(s as any, cwd));

  const regularPolicies = BUILTIN_POLICIES.filter((p) => !p.beta);
  const betaPolicies = BUILTIN_POLICIES.filter((p) => p.beta);

  const nameColWidth = Math.max(...BUILTIN_POLICIES.map((p) => p.name.length)) + 2;
  const builtinPolicyNames = new Set(BUILTIN_POLICIES.map((p) => p.name));

  const printParamsSummary = (policyName: string, indent: string) => {
    const params = config.policyParams?.[policyName];
    if (!params) return;
    for (const [key, val] of Object.entries(params)) {
      console.log(`${indent}  ${key}: ${JSON.stringify(val)}`);
    }
  };

  const statusCol = installedScopes.length > 1 ? installedScopes.length * 9 : 8;

  if (installedScopes.length === 0) {
    console.log(`\nFailproof AI Policies \u2014 not installed (${integ.displayName})\n`);
    console.log(`  ${"Status".padEnd(8)}${"Name".padEnd(nameColWidth)}Description`);
    console.log(`  ${"\u2500".repeat(6)}  ${"\u2500".repeat(nameColWidth - 2)}  ${"\u2500".repeat(38)}`);

    for (const p of regularPolicies) {
      const mark = enabledSet.has(p.name) ? `\x1B[32m\u2713\x1B[0m` : " ";
      console.log(`  ${mark}${" ".repeat(7)}${p.name.padEnd(nameColWidth)}${p.description}`);
      printParamsSummary(p.name, "          ");
    }

    if (betaPolicies.length > 0) {
      console.log(`\n  \x1B[2m\u2500\u2500 Beta \u2500\u2500\x1B[0m`);
      for (const p of betaPolicies) {
        const mark = enabledSet.has(p.name) ? `\x1B[32m\u2713\x1B[0m` : " ";
        console.log(`  ${mark}${" ".repeat(7)}${p.name.padEnd(nameColWidth)}${p.description}`);
        printParamsSummary(p.name, "          ");
      }
    }
    console.log("\n  Run `failproofai policies --install` to get started.");
  } else if (installedScopes.length === 1) {
    const scope = installedScopes[0];
    console.log(`\nFailproof AI Hook Policies (${scope})\n`);
    console.log(`  ${"Status".padEnd(8)}${"Name".padEnd(nameColWidth)}Description`);
    console.log(`  ${"\u2500".repeat(6)}  ${"\u2500".repeat(nameColWidth - 2)}  ${"\u2500".repeat(38)}`);

    for (const p of regularPolicies) {
      const mark = enabledSet.has(p.name) ? `\x1B[32m\u2713\x1B[0m` : " ";
      console.log(`  ${mark}${" ".repeat(7)}${p.name.padEnd(nameColWidth)}${p.description}`);
      printParamsSummary(p.name, "          ");
    }
    if (betaPolicies.length > 0) {
      console.log(`\n  \x1B[2m\u2500\u2500 Beta \u2500\u2500\x1B[0m`);
      for (const p of betaPolicies) {
        const mark = enabledSet.has(p.name) ? `\x1B[32m\u2713\x1B[0m` : " ";
        console.log(`  ${mark}${" ".repeat(7)}${p.name.padEnd(nameColWidth)}${p.description}`);
        printParamsSummary(p.name, "          ");
      }
    }
  } else {
    const COL = 9;
    const formatScopeName = (s: string) => `${s[0].toUpperCase()}${s.slice(1)}`;
    console.log(`\nFailproof AI Hook Policies (${integ.displayName})\n`);

    let header = "  ";
    for (const s of installedScopes) header += formatScopeName(s).padEnd(COL);
    header += "Name".padEnd(nameColWidth) + "Description";
    console.log(header);
    console.log(`  ${"\u2500".repeat(installedScopes.length * COL)}${"\u2500".repeat(nameColWidth)}${"\u2500".repeat(38)}`);

    const printRow = (p: { name: string; description: string }) => {
      let row = "  ";
      const enabled = enabledSet.has(p.name);
      for (const _s of installedScopes) {
        row += enabled ? `\x1B[32m\u2713 ON\x1B[0m`.padEnd(COL + 9) : `  OFF`.padEnd(COL);
      }
      row += p.name.padEnd(nameColWidth) + p.description;
      console.log(row);
      printParamsSummary(p.name, " ".repeat(2 + installedScopes.length * COL));
    };

    for (const p of regularPolicies) printRow(p);
    if (betaPolicies.length > 0) {
      console.log(`\n  \x1B[2m\u2500\u2500 Beta \u2500\u2500\x1B[0m`);
      for (const p of betaPolicies) printRow(p);
    }
  }

  // Config path hint
  const primaryScope = installedScopes.length > 0 ? installedScopes[0] : "user";
  const configPath = getConfigPathForScope(primaryScope as HookScope, cwd);
  console.log(`\n  Settings: ${integ.getSettingsPath(primaryScope as any, cwd)}`);
  console.log(`  Config:   ${configPath}\n`);

  // Warn about unknown policyParams keys
  if (config.policyParams) {
    for (const key of Object.keys(config.policyParams)) {
      if (!builtinPolicyNames.has(key)) {
        console.log(`  \x1B[33mWarning: unknown policyParams key "${key}" — possible typo\x1B[0m`);
      }
    }
  }

  if (config.customPoliciesPath) {
    console.log(`\n  \u2500\u2500 Custom Policies (${config.customPoliciesPath}) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
    if (!existsSync(config.customPoliciesPath)) {
      console.log(`  \x1B[31m\u2717 File not found: ${config.customPoliciesPath}\x1B[0m`);
    } else {
      const hooks = await loadCustomHooks(config.customPoliciesPath);
      if (hooks.length === 0) {
        console.log(`  \x1B[31m\u2717 ERR  failed to load (check ~/.failproofai/logs/hooks.log)\x1B[0m`);
      } else {
        for (const h of hooks) {
          console.log(`  \x1B[32m\u2713\x1B[0m       ${h.name.padEnd(nameColWidth)}${h.description ?? ""}`);
        }
      }
    }
    console.log();
  }

  // Convention Policies section (.failproofai/policies/*policies.{js,mjs,ts})
  const base = cwd ? resolve(cwd) : process.cwd();
  const conventionDirs: { label: string; dir: string }[] = [
    { label: "Project", dir: resolve(base, ".failproofai", "policies") },
    { label: "User", dir: resolve(homedir(), ".failproofai", "policies") },
  ];

  for (const { label, dir } of conventionDirs) {
    const files = discoverPolicyFiles(dir);
    if (files.length === 0) continue;

    console.log(`\n  \u2500\u2500 Convention Policies \u2014 ${label} (${dir}) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
    for (const file of files) {
      try {
        const hooks = await loadCustomHooks(file);
        if (hooks.length === 0) {
          const filename = basename(file);
          console.log(`  \x1B[31m\u2717\x1B[0m       ${filename.padEnd(nameColWidth)}\x1B[31mfailed to load\x1B[0m`);
        } else {
          const filename = basename(file);
          const hookSummary = hooks.map((h) => h.name).join(", ");
          console.log(`  \x1B[32m\u2713\x1B[0m       ${filename.padEnd(nameColWidth)}${hooks.length} hook(s): ${hookSummary}`);
        }
      } catch {
        const filename = basename(file);
        console.log(`  \x1B[31m\u2717\x1B[0m       ${filename.padEnd(nameColWidth)}\x1B[31merror\x1B[0m`);
      }
    }
    console.log();
  }
}
