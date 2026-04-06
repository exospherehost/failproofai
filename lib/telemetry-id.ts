import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const NAMESPACE = "failproofai-telemetry-v1";
const ID_DIR = path.join(os.homedir(), ".failproofai");
const ID_FILE = path.join(ID_DIR, "instance-id");

let cachedId: string | undefined;

export function hashToId(raw: string): string {
  return crypto.createHmac("sha256", NAMESPACE).update(raw).digest("hex");
}

export function getPlatformMachineId(): string | undefined {
  try {
    const platform = os.platform();
    if (platform === "linux") {
      for (const p of ["/etc/machine-id", "/var/lib/dbus/machine-id"]) {
        try {
          const id = fs.readFileSync(p, "utf-8").trim();
          if (id) return id;
        } catch {}
      }
    } else if (platform === "darwin") {
      const out = execSync("ioreg -rd1 -c IOPlatformExpertDevice", {
        encoding: "utf-8",
        timeout: 3000,
      });
      const m = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (m?.[1]) return m[1];
    } else if (platform === "win32") {
      const out = execSync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
        { encoding: "utf-8", timeout: 3000 },
      );
      const m = out.match(/MachineGuid\s+REG_SZ\s+(\S+)/);
      if (m?.[1]) return m[1];
    }
  } catch {}
  return undefined;
}

export function getSystemPropertiesId(): string {
  return [
    os.hostname(),
    os.homedir(),
    os.platform(),
    os.arch(),
    os.cpus()[0]?.model ?? "",
  ].join(":");
}

function getFileBasedId(): string {
  try {
    const existing = fs.readFileSync(ID_FILE, "utf-8").trim();
    if (existing) return existing;
  } catch {}
  const id = crypto.randomUUID();
  try {
    fs.mkdirSync(ID_DIR, { recursive: true });
    fs.writeFileSync(ID_FILE, id, "utf-8");
  } catch {}
  return id;
}

/**
 * Returns a stable, anonymous machine ID for telemetry.
 *
 * Uses a 3-tier strategy:
 * 1. OS-native machine ID (most stable — survives cache deletion)
 * 2. Hashed system properties (fallback — less stable if hostname changes)
 * 3. File-based random UUID at `~/.failproofai/instance-id` (final fallback)
 *
 * All raw values are HMAC-hashed with an app-specific namespace so no PII
 * is transmitted. The result is cached in-process to avoid repeated I/O.
 */
export function getInstanceId(): string {
  if (cachedId) return cachedId;

  const machineId = getPlatformMachineId();
  if (machineId) {
    cachedId = hashToId(machineId);
    return cachedId;
  }

  const sysProps = getSystemPropertiesId();
  if (sysProps) {
    cachedId = hashToId(sysProps);
    return cachedId;
  }

  cachedId = getFileBasedId();
  return cachedId;
}
