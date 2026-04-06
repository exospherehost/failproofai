"use server";

import { readHooksConfig, writeHooksConfig } from "@/src/hooks/hooks-config";
import { trackHookEvent } from "@/src/hooks/hook-telemetry";
import { getInstanceId } from "@/lib/telemetry-id";

export async function togglePolicyAction(name: string, enabled: boolean): Promise<void> {
  const config = readHooksConfig();
  const set = new Set(config.enabledPolicies);
  if (enabled) {
    set.add(name);
  } else {
    set.delete(name);
  }
  writeHooksConfig({ ...config, enabledPolicies: [...set] });

  // Telemetry: track policy toggle from the web UI (best-effort)
  try {
    const distinctId = getInstanceId();
    await trackHookEvent(distinctId, "policy_toggled", {
      policy_name: name,
      enabled,                                // new state: true = on, false = off
      action: enabled ? "enable" : "disable", // human-readable direction
      source: "web",
    });
  } catch {
    // Never block the operation
  }
}
