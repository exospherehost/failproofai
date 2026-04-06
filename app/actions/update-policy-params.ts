"use server";

import { readHooksConfig, writeHooksConfig } from "@/src/hooks/hooks-config";
import { trackHookEvent } from "@/src/hooks/hook-telemetry";
import { getInstanceId } from "@/lib/telemetry-id";

export async function updatePolicyParamsAction(
  policyName: string,
  params: Record<string, unknown>,
): Promise<void> {
  const config = readHooksConfig();
  const policyParams = { ...(config.policyParams ?? {}), [policyName]: params };
  writeHooksConfig({ ...config, policyParams });

  // Telemetry: track policy parameter configuration from the web UI (best-effort)
  try {
    const distinctId = getInstanceId();
    await trackHookEvent(distinctId, "policy_params_updated", {
      policy_name: policyName,
      param_keys: Object.keys(params),
      source: "web",
    });
  } catch {
    // Never block the operation
  }
}
