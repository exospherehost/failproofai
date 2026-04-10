/**
 * Shared OpenAI-compatible chat completions client.
 *
 * Uses raw `fetch` — no SDK dependency. Any policy can import this
 * to make LLM calls using the shared configuration from policies-config.json
 * or environment variables.
 */
import { readLlmConfig } from "./hooks-config";
import { hookLogInfo, hookLogError } from "./hook-logger";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
}

export interface ChatCompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions & { cwd?: string },
): Promise<ChatCompletionResponse> {
  const config = readLlmConfig(options?.cwd);
  if (!config) {
    throw new Error(
      "No LLM API key configured. Set FAILPROOFAI_LLM_API_KEY or configure llm.apiKey in policies-config.json",
    );
  }

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 4096,
  };
  if (options?.responseFormat) {
    body.response_format = options.responseFormat;
  }

  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;

  hookLogInfo(`llm-client: POST ${url} model=${config.model} messages=${messages.length}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    let errBody = "";
    try { errBody = await response.text(); } catch {}
    hookLogError(`llm-client: ${response.status} ${response.statusText} — ${errBody.slice(0, 200)}`);
    throw new Error(`LLM API error: ${response.status} ${response.statusText} — ${errBody.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  const content = json.choices?.[0]?.message?.content ?? "";

  const usage = json.usage
    ? {
        promptTokens: json.usage.prompt_tokens ?? 0,
        completionTokens: json.usage.completion_tokens ?? 0,
        totalTokens: json.usage.total_tokens ?? 0,
      }
    : undefined;

  hookLogInfo(`llm-client: OK tokens=${usage?.totalTokens ?? "unknown"}`);
  return { content, usage };
}
