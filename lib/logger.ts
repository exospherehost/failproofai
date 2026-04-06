/**
 * Centralized logger with level filtering.
 *
 * Reads FAILPROOFAI_LOG_LEVEL env var (info | warn | error).
 * Default level: warn — only WARN and ERROR messages are emitted.
 *
 * Format: [failproofai<ISO timestamp>] LEVEL message
 */

export type LogLevel = "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { info: 0, warn: 1, error: 2 };

let currentLevel: LogLevel = "warn";

export function initLogger(): void {
  const raw = (process.env.FAILPROOFAI_LOG_LEVEL ?? "").toLowerCase();
  if (raw === "info" || raw === "warn" || raw === "error") {
    currentLevel = raw;
  } else {
    currentLevel = "warn";
  }
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function shouldEmit(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

function stamp(label: string): string {
  return `[failproofai${new Date().toISOString()}] ${label}`;
}

export function logInfo(msg: string, detail?: unknown): void {
  if (!shouldEmit("info")) return;
  if (detail !== undefined) {
    console.log(stamp("INFO"), msg, detail);
  } else {
    console.log(stamp("INFO"), msg);
  }
}

export function logWarn(msg: string, detail?: unknown): void {
  if (!shouldEmit("warn")) return;
  if (detail !== undefined) {
    console.warn(stamp("WARN"), msg, detail);
  } else {
    console.warn(stamp("WARN"), msg);
  }
}

export function logError(msg: string, detail?: unknown): void {
  // error is always emitted
  if (detail !== undefined) {
    console.error(stamp("ERROR"), msg, detail);
  } else {
    console.error(stamp("ERROR"), msg);
  }
}

export function logActivity(username: string, action: string, detail?: string): void {
  if (!shouldEmit("info")) return;
  const parts = [`user=${username}`, `action=${action}`];
  if (detail) parts.push(detail);
  console.log(stamp("ACTIVITY"), parts.join(" "));
}

