"use server";

import { installHooks, removeHooks } from "@/src/hooks/manager";
import { readHooksConfig } from "@/src/hooks/hooks-config";
import { BUILTIN_POLICIES } from "@/src/hooks/builtin-policies";
import { INTEGRATION_TYPES } from "@/src/hooks/types";
import { getIntegration } from "@/src/hooks/integrations";
import type { HookScope } from "@/src/hooks/types";

export interface IntegrationStatus {
  id: string;
  name: string;
  installed: boolean;
}

export async function getIntegrationsStatusAction(): Promise<IntegrationStatus[]> {
  return INTEGRATION_TYPES.map((id) => {
    const integ = getIntegration(id);
    return { id, name: integ.displayName, installed: integ.detectInstalled() };
  });
}

export async function installHooksWebAction(
  scope: HookScope = "user",
  integrations?: string[],
): Promise<void> {
  const config = readHooksConfig();
  // On first install (no config yet), default to all defaultEnabled non-beta policies.
  // Always pass an explicit array so installHooks never triggers the interactive TUI.
  const policies =
    config.enabledPolicies.length > 0
      ? config.enabledPolicies
      : BUILTIN_POLICIES.filter((p) => p.defaultEnabled && !p.beta).map((p) => p.name);
  await installHooks(policies, scope, undefined, false, "web", undefined, false, integrations);
}

export async function removeHooksWebAction(scope: HookScope | "all" = "user"): Promise<void> {
  await removeHooks(undefined, scope, undefined, { source: "web" });
}
