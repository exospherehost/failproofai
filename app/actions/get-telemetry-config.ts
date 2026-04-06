"use server";

import { getInstanceId } from "@/lib/telemetry-id";
import { isTelemetryEnabled } from "@/lib/telemetry";
import { version } from "../../package.json";

const DEFAULT_API_KEY = "phc_Ac1Ww1GqKc0z1SyrRWbmatEeQdlOQIsDEEdP8l8JRgX";
const DEFAULT_HOST = "https://us.i.posthog.com";

export interface TelemetryConfig {
  enabled: boolean;
  distinctId: string;
  apiKey: string;
  host: string;
  version: string;
}

export async function getTelemetryConfig(): Promise<TelemetryConfig> {
  const enabled = isTelemetryEnabled();
  return {
    enabled,
    distinctId: enabled ? getInstanceId() : "",
    apiKey: process.env.FAILPROOFAI_POSTHOG_KEY ?? DEFAULT_API_KEY,
    host: process.env.FAILPROOFAI_POSTHOG_HOST ?? DEFAULT_HOST,
    version,
  };
}
