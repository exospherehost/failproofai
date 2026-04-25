"use server";

import { readHooksConfig, writeHooksConfig } from "@/src/hooks/hooks-config";
import type { IntegrationType } from "@/src/hooks/types";

/**
 * Toggle a policy for a specific CLI integration.
 * 'enable' adds to cli[id].enabledPolicies
 * 'disable' adds to cli[id].disabledPolicies
 * 'inherit' removes from both (falls back to global)
 */
export async function toggleCliPolicyAction(
  integrationId: string,
  policyName: string,
  mode: "enable" | "disable" | "inherit",
): Promise<void> {
  const config = readHooksConfig();
  if (!config.cli) config.cli = {};
  
  const id = integrationId as IntegrationType;
  if (!config.cli[id]) {
    config.cli[id] = {
      enabledPolicies: [],
      disabledPolicies: [],
      policyParams: {},
    };
  }

  const cli = config.cli[id]!;
  const enabled = new Set(cli.enabledPolicies ?? []);
  const disabled = new Set(cli.disabledPolicies ?? []);

  if (mode === "enable") {
    enabled.add(policyName);
    disabled.delete(policyName);
  } else if (mode === "disable") {
    disabled.add(policyName);
    enabled.delete(policyName);
  } else if (mode === "inherit") {
    enabled.delete(policyName);
    disabled.delete(policyName);
  }

  cli.enabledPolicies = Array.from(enabled);
  cli.disabledPolicies = Array.from(disabled);

  // Cleanup if empty
  if (
    cli.enabledPolicies.length === 0 && 
    cli.disabledPolicies.length === 0 && 
    (!cli.policyParams || Object.keys(cli.policyParams).length === 0)
  ) {
    delete config.cli[id];
  }

  writeHooksConfig(config);
}

/**
 * Update policy parameters for a specific CLI integration.
 */
export async function updateCliPolicyParamsAction(
  integrationId: string,
  policyName: string,
  params: Record<string, unknown>,
): Promise<void> {
  const config = readHooksConfig();
  if (!config.cli) config.cli = {};

  const id = integrationId as IntegrationType;
  if (!config.cli[id]) {
    config.cli[id] = {
      enabledPolicies: [],
      disabledPolicies: [],
      policyParams: {},
    };
  }

  const cli = config.cli[id]!;
  if (!cli.policyParams) cli.policyParams = {};
  cli.policyParams[policyName] = params;

  writeHooksConfig(config);
}
