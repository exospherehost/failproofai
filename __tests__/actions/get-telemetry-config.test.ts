// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/telemetry-id", () => ({
  getInstanceId: () => "test-distinct-id",
}));

vi.mock("@/lib/telemetry", () => ({
  isTelemetryEnabled: vi.fn(() => true),
}));

import { getTelemetryConfig } from "@/app/actions/get-telemetry-config";
import { isTelemetryEnabled } from "@/lib/telemetry";

describe("getTelemetryConfig", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.mocked(isTelemetryEnabled).mockReturnValue(true);
  });

  it("returns enabled: false when telemetry is disabled", async () => {
    vi.mocked(isTelemetryEnabled).mockReturnValue(false);
    const config = await getTelemetryConfig();
    expect(config.enabled).toBe(false);
    expect(config.distinctId).toBe("");
  });

  it("returns default apiKey and host when env vars are unset", async () => {
    delete process.env.FAILPROOFAI_POSTHOG_KEY;
    delete process.env.FAILPROOFAI_POSTHOG_HOST;
    const config = await getTelemetryConfig();
    expect(config.apiKey).toBe("phc_Ac1Ww1GqKc0z1SyrRWbmatEeQdlOQIsDEEdP8l8JRgX");
    expect(config.host).toBe("https://us.i.posthog.com");
  });

  it("returns custom apiKey and host when env vars are set", async () => {
    process.env.FAILPROOFAI_POSTHOG_KEY = "custom-key";
    process.env.FAILPROOFAI_POSTHOG_HOST = "https://custom.posthog.com";
    const config = await getTelemetryConfig();
    expect(config.apiKey).toBe("custom-key");
    expect(config.host).toBe("https://custom.posthog.com");
  });

  it("returns a non-empty distinctId when enabled", async () => {
    const config = await getTelemetryConfig();
    expect(config.enabled).toBe(true);
    expect(config.distinctId).toBe("test-distinct-id");
  });

  it("returns a version string", async () => {
    const config = await getTelemetryConfig();
    expect(config.version).toBeTypeOf("string");
    expect(config.version.length).toBeGreaterThan(0);
  });
});
