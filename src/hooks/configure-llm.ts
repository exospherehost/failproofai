/**
 * Interactive LLM configuration for hook policies.
 *
 * Prompts for API key, base URL, and model when not provided via flags.
 * Saves to ~/.failproofai/hooks-config.json under the `llm` key.
 */
import * as readline from "node:readline";
import { readHooksConfig, writeHooksConfig, readLlmConfig } from "./hooks-config";

export interface ConfigureLlmFlags {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

export async function configureLlm(flags: ConfigureLlmFlags): Promise<void> {
  const existing = readLlmConfig();
  const config = readHooksConfig();

  // If all flags provided, save directly without interactive prompt
  if (flags.apiKey) {
    const llm = {
      apiKey: flags.apiKey,
      baseUrl: flags.baseUrl ?? existing?.baseUrl ?? "https://api.openai.com/v1",
      model: flags.model ?? existing?.model ?? "gpt-4o-mini",
    };
    config.llm = llm;
    writeHooksConfig(config);
    console.log("\n  LLM configuration saved to hooks-config.json\n");
    printSummary(llm);
    return;
  }

  // Interactive mode
  console.log("\n  Failproof AI \u2014 Configure LLM provider\n");
  console.log("  This configures the LLM used by smart policies (e.g. verify-intent).");
  console.log("  Any OpenAI-compatible API works (OpenAI, Groq, Together, Ollama, etc.).\n");

  if (existing) {
    console.log("  Current configuration:");
    console.log(`    Provider:  ${existing.baseUrl}`);
    console.log(`    Model:     ${existing.model}`);
    console.log(`    API Key:   ${maskKey(existing.apiKey)}`);
    console.log();
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const apiKey = await prompt(
      rl,
      `  API Key${existing ? ` [${maskKey(existing.apiKey)}]` : ""}: `,
    );
    const resolvedApiKey = apiKey || existing?.apiKey;
    if (!resolvedApiKey) {
      console.error("\n  Error: API key is required.\n");
      process.exit(1);
    }

    const defaultBaseUrl = flags.baseUrl ?? existing?.baseUrl ?? "https://api.openai.com/v1";
    const baseUrl = await prompt(rl, `  Base URL [${defaultBaseUrl}]: `);
    const resolvedBaseUrl = baseUrl || defaultBaseUrl;

    const defaultModel = flags.model ?? existing?.model ?? "gpt-4o-mini";
    const model = await prompt(rl, `  Model [${defaultModel}]: `);
    const resolvedModel = model || defaultModel;

    const llm = {
      apiKey: resolvedApiKey,
      baseUrl: resolvedBaseUrl,
      model: resolvedModel,
    };

    config.llm = llm;
    writeHooksConfig(config);

    console.log("\n  LLM configuration saved to hooks-config.json\n");
    printSummary(llm);
  } finally {
    rl.close();
  }
}

function printSummary(llm: { apiKey: string; baseUrl: string; model: string }): void {
  console.log("  Configuration:");
  console.log(`    Provider:  ${llm.baseUrl}`);
  console.log(`    Model:     ${llm.model}`);
  console.log(`    API Key:   ${maskKey(llm.apiKey)}`);
  console.log();
  console.log("  You can also override at runtime with environment variables:");
  console.log("    FAILPROOFAI_LLM_API_KEY, FAILPROOFAI_LLM_BASE_URL, FAILPROOFAI_LLM_MODEL");
  console.log();
}
