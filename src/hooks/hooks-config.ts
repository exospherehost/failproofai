/**
 * Read/write the hooks configuration file at ~/.failproofai/policies-config.json.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import type { HooksConfig } from "./policy-types";
import type { HookScope } from "./types";
import { hookLogInfo, hookLogWarn } from "./hook-logger";

function readConfigAt(path: string): Partial<HooksConfig> {
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as Partial<HooksConfig>;
  } catch (err) {
    hookLogWarn(`failed to parse config at ${path}: ${err instanceof Error ? err.message : String(err)}`);
    return {};
  }
}

/**
 * Read and merge hooks config from three scopes in priority order:
 *   1. {cwd}/.failproofai/policies-config.json        (project)
 *   2. {cwd}/.failproofai/policies-config.local.json  (local)
 *   3. ~/.failproofai/policies-config.json             (global)
 *
 * Merge rules:
 *   enabledPolicies: union + dedup across all three
 *   policyParams:    per-policy key, first scope that defines it wins entirely
 *   customPoliciesPath: first scope that defines it wins
 *   llm:            first scope that defines it wins
 */
export function readMergedHooksConfig(cwd?: string): HooksConfig {
  const base = cwd ? resolve(cwd) : process.cwd();
  const projectPath = resolve(base, ".failproofai", "policies-config.json");
  const localPath = resolve(base, ".failproofai", "policies-config.local.json");
  const globalPath = resolve(homedir(), ".failproofai", "policies-config.json");

  const project = readConfigAt(projectPath);
  const local = readConfigAt(localPath);
  const global_ = readConfigAt(globalPath);

  // enabledPolicies: union + dedup
  const enabledSet = new Set<string>([
    ...(project.enabledPolicies ?? []),
    ...(local.enabledPolicies ?? []),
    ...(global_.enabledPolicies ?? []),
  ]);

  // policyParams: per-policy, first scope wins
  const mergedParams: Record<string, Record<string, unknown>> = {};
  for (const scope of [project, local, global_]) {
    if (!scope.policyParams) continue;
    for (const [policyName, params] of Object.entries(scope.policyParams)) {
      if (!(policyName in mergedParams)) {
        mergedParams[policyName] = params;
      }
    }
  }

  // customPoliciesPath: first scope wins
  const customPoliciesPath =
    project.customPoliciesPath ?? local.customPoliciesPath ?? global_.customPoliciesPath;

  // llm: first scope wins
  const llm = project.llm ?? local.llm ?? global_.llm;

  return {
    enabledPolicies: [...enabledSet],
    ...(Object.keys(mergedParams).length > 0 ? { policyParams: mergedParams } : {}),
    ...(customPoliciesPath !== undefined ? { customPoliciesPath } : {}),
    ...(llm !== undefined ? { llm } : {}),
  };
}

function getConfigPath(): string {
  return resolve(homedir(), ".failproofai", "policies-config.json");
}

export function readHooksConfig(): HooksConfig {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return { enabledPolicies: [] };
  }
  try {
    const raw = readFileSync(configPath, "utf8");
    return JSON.parse(raw) as HooksConfig;
  } catch (err) {
    hookLogWarn(`failed to parse config at ${configPath}: ${err instanceof Error ? err.message : String(err)}`);
    return { enabledPolicies: [] };
  }
}

export function writeHooksConfig(config: HooksConfig): void {
  const configPath = getConfigPath();
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
}

/**
 * Resolve the policies-config path for a specific scope.
 */
export function getConfigPathForScope(scope: HookScope, cwd?: string): string {
  const base = cwd ? resolve(cwd) : process.cwd();
  switch (scope) {
    case "user":
      return resolve(homedir(), ".failproofai", "policies-config.json");
    case "project":
      return resolve(base, ".failproofai", "policies-config.json");
    case "local":
      return resolve(base, ".failproofai", "policies-config.local.json");
  }
}

/**
 * Read hooks config from a single specific scope (not merged).
 */
export function readScopedHooksConfig(scope: HookScope, cwd?: string): HooksConfig {
  const configPath = getConfigPathForScope(scope, cwd);
  if (!existsSync(configPath)) {
    return { enabledPolicies: [] };
  }
  try {
    const raw = readFileSync(configPath, "utf8");
    return JSON.parse(raw) as HooksConfig;
  } catch (err) {
    hookLogWarn(`failed to parse config at ${configPath}: ${err instanceof Error ? err.message : String(err)}`);
    return { enabledPolicies: [] };
  }
}

/**
 * Write hooks config to the scope-appropriate path.
 */
export function writeScopedHooksConfig(config: HooksConfig, scope: HookScope, cwd?: string): void {
  const configPath = getConfigPathForScope(scope, cwd);
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf8");
}

export interface ResolvedLlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function readLlmConfig(cwd?: string): ResolvedLlmConfig | null {
  const config = readMergedHooksConfig(cwd);
  const baseUrl =
    process.env.FAILPROOFAI_LLM_BASE_URL ?? config.llm?.baseUrl ?? "https://api.openai.com/v1";
  const apiKey = process.env.FAILPROOFAI_LLM_API_KEY ?? config.llm?.apiKey;
  const model = process.env.FAILPROOFAI_LLM_MODEL ?? config.llm?.model ?? "gpt-4o-mini";
  const apiKeySource = process.env.FAILPROOFAI_LLM_API_KEY ? "env" : config.llm?.apiKey ? "file" : "missing";
  const baseUrlSource = process.env.FAILPROOFAI_LLM_BASE_URL ? "env" : config.llm?.baseUrl ? "file" : "default";
  const modelSource = process.env.FAILPROOFAI_LLM_MODEL ? "env" : config.llm?.model ? "file" : "default";
  hookLogInfo(`llm-config: apiKey=${apiKeySource} baseUrl=${baseUrlSource}(${baseUrl}) model=${modelSource}(${model})`);
  if (!apiKey) return null;
  return { baseUrl, apiKey, model };
}
