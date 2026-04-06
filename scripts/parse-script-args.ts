/**
 * Shared CLI argument parser for scripts/dev.ts and scripts/start.ts.
 */
import { resolve } from "path";

export interface ParsedScriptArgs {
  claudeProjectsPath: string | undefined;
  loggingLevel: string | undefined;
  disableTelemetry: boolean;
  remainingArgs: string[];
}

function parseStringFlag(
  flagName: string,
  errorLabel: string,
  inlineValue: string | null,
  args: string[],
  index: number,
  options?: { resolve?: boolean },
): { value: string; spliceCount: number } {
  const raw = inlineValue ?? args[index + 1];
  if (raw === undefined || (inlineValue === null && raw.startsWith("-"))) {
    console.error(`Error: ${flagName} requires ${errorLabel}`);
    process.exit(1);
  }
  const value = options?.resolve ? resolve(raw) : raw;
  return { value, spliceCount: inlineValue !== null ? 1 : 2 };
}

export function parseScriptArgs(argv: string[]): ParsedScriptArgs {
  const args = [...argv];
  let claudeProjectsPath: string | undefined;
  let loggingLevel: string | undefined;
  let disableTelemetry = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    const eqIdx = arg.indexOf("=");
    const flag = eqIdx >= 0 ? arg.slice(0, eqIdx) : arg;
    const inlineValue = eqIdx >= 0 ? arg.slice(eqIdx + 1) : null;

    if (flag === "--projects-path" || flag === "-p") {
      const { value, spliceCount } = parseStringFlag(flag, "a path argument", inlineValue, args, i);
      claudeProjectsPath = value;
      args.splice(i, spliceCount);
      i--;
      continue;
    }

    if (flag === "--logging") {
      const raw = inlineValue ?? args[i + 1];
      if (raw === undefined || (inlineValue === null && raw.startsWith("-"))) {
        console.error("Error: --logging requires a level (info, warn, error)");
        process.exit(1);
      }
      const val = raw.toLowerCase();
      if (val !== "info" && val !== "warn" && val !== "error") {
        console.error("Error: --logging must be one of: info, warn, error");
        process.exit(1);
      }
      loggingLevel = val;
      args.splice(i, inlineValue !== null ? 1 : 2);
      i--;
      continue;
    }

    if (flag === "--disable-telemetry") {
      disableTelemetry = true;
      args.splice(i, 1);
      i--;
      continue;
    }
  }

  return { claudeProjectsPath, loggingLevel, disableTelemetry, remainingArgs: args };
}
