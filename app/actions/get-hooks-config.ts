"use server";

import { readHooksConfig } from "@/src/hooks/hooks-config";
import { hooksInstalledInSettings, getSettingsPath } from "@/src/hooks/manager";
import { BUILTIN_POLICIES } from "@/src/hooks/builtin-policies";
import { listIntegrations } from "@/src/hooks/integrations";
import { HOOK_SCOPES } from "@/src/hooks/types";
import type { HookScope, IntegrationType } from "@/src/hooks/types";
import { getCliLabel } from "@/lib/cli-registry";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export interface PolicyParamSpec {
  type: string;
  description: string;
  default: unknown;
}

export interface PolicyInfo {
  name: string;
  description: string;
  category: string;
  defaultEnabled: boolean;
  beta: boolean;
  enabled: boolean;
  eventScope: string;
  params?: Record<string, PolicyParamSpec>;
  currentParams?: Record<string, unknown>;
}

export interface CustomPolicyInfo {
  name: string;
  description?: string;
  eventScope?: string;
}

export interface CliInstallStatus {
  id: IntegrationType;
  label: string;
  installed: boolean;
  settingsPath: string;
  /** Whether the agent CLI's binary was found on PATH. */
  detected: boolean;
}

export interface HooksConfigPayload {
  enabledPolicies: string[];
  /** Claude-only legacy field; kept for back-compat. New UI should consume `clis`. */
  installedScopes: HookScope[];
  /** Claude-only legacy field; kept for back-compat. New UI should consume `clis`. */
  settingsPath: string;
  /** Per-CLI install state at user scope, in `INTEGRATION_TYPES` order. */
  clis: CliInstallStatus[];
  policies: PolicyInfo[];
  customPoliciesPath?: string;
  customPolicies?: CustomPolicyInfo[];
}

async function parseCustomPoliciesFromFile(filePath: string): Promise<CustomPolicyInfo[]> {
  if (!existsSync(filePath)) return [];
  const source = await readFile(filePath, "utf-8");
  const policies: CustomPolicyInfo[] = [];
  const segments = source.split(/customPolicies\.add\s*\(/);
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const nameMatch = seg.match(/name:\s*["'`]([^"'`]+)["'`]/);
    if (!nameMatch) continue;
    const descMatch = seg.match(/description:\s*["'`]([^"'`]+)["'`]/);
    const eventsMatch = seg.match(/events:\s*\[([^\]]+)\]/);
    const eventScope = eventsMatch
      ? eventsMatch[1].replace(/["'`\s]/g, "").split(",").filter(Boolean).join(", ")
      : undefined;
    policies.push({ name: nameMatch[1], description: descMatch?.[1], eventScope });
  }
  return policies;
}

function buildEventScope(match: { events?: string[]; toolNames?: string[] }): string {
  const events = match.events?.join(", ") ?? "";
  const tools = match.toolNames ? ` · ${match.toolNames.join(", ")}` : "";
  return `${events}${tools}`;
}

export async function getHooksConfigAction(): Promise<HooksConfigPayload> {
  const config = readHooksConfig();
  const enabledSet = new Set(config.enabledPolicies);

  const installedScopes = HOOK_SCOPES.filter((s) => hooksInstalledInSettings(s));
  const primaryScope: HookScope = installedScopes[0] ?? "user";
  const settingsPath = getSettingsPath(primaryScope);

  const clis: CliInstallStatus[] = listIntegrations().map((integration) => ({
    id: integration.id,
    label: getCliLabel(integration.id),
    installed: integration.hooksInstalledInSettings("user"),
    settingsPath: integration.getSettingsPath("user"),
    detected: integration.detectInstalled(),
  }));

  const policies: PolicyInfo[] = BUILTIN_POLICIES.map((p) => ({
    name: p.name,
    description: p.description,
    category: p.category,
    defaultEnabled: p.defaultEnabled,
    beta: !!p.beta,
    enabled: enabledSet.has(p.name),
    eventScope: buildEventScope(p.match),
    params: p.params
      ? Object.fromEntries(
          Object.entries(p.params).map(([k, v]) => [k, { type: v.type, description: v.description, default: v.default }])
        )
      : undefined,
    currentParams: p.params ? (config.policyParams?.[p.name] ?? {}) : undefined,
  }));

  const customPolicies = config.customPoliciesPath
    ? await parseCustomPoliciesFromFile(config.customPoliciesPath)
    : undefined;

  return {
    enabledPolicies: config.enabledPolicies,
    installedScopes,
    settingsPath,
    clis,
    policies,
    customPoliciesPath: config.customPoliciesPath,
    customPolicies: customPolicies?.length ? customPolicies : undefined,
  };
}
