/**
 * Verify-intent policy — fires on the Stop event.
 *
 * Two-pass LLM verification:
 *   Pass 1: Extract user intents from the transcript.
 *   Pass 2: Verify each intent was satisfied.
 *
 * If unsatisfied intents remain and retries < 3, returns "instruct"
 * so Claude continues working. Otherwise allows the stop.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";
import type { PolicyContext, PolicyResult } from "./policy-types";
import { allow, instruct } from "./policy-helpers";
import { chatCompletion } from "./llm-client";
import { hookLogInfo, hookLogWarn, hookLogError } from "./hook-logger";

// -- Interfaces --

interface Intent {
  id: number;
  description: string;
  source: string;
}

interface VerificationResult {
  id: number;
  status: "satisfied" | "unsatisfied";
  evidence: string;
}

interface RetryState {
  sessionId: string;
  retryCount: number;
  lastCheckedAt: number;
  unsatisfiedIntents: VerificationResult[];
}

// -- Helpers --

function isUserEntry(entry: TranscriptEntry): boolean {
  return entry.type === "human" || entry.type === "user";
}

const MAX_RETRIES = 3;
const MAX_TRANSCRIPT_CHARS = 50_000;

function getRetryDir(): string {
  return resolve(homedir(), ".failproofai", "cache", "verify-intent");
}

function getRetryPath(sessionId: string): string {
  return resolve(getRetryDir(), `${sessionId}.json`);
}

function getRetryState(sessionId: string): RetryState {
  const path = getRetryPath(sessionId);
  if (!existsSync(path)) {
    return { sessionId, retryCount: 0, lastCheckedAt: 0, unsatisfiedIntents: [] };
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as RetryState;
  } catch {
    return { sessionId, retryCount: 0, lastCheckedAt: 0, unsatisfiedIntents: [] };
  }
}

function saveRetryState(sessionId: string, state: RetryState): void {
  const dir = getRetryDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(getRetryPath(sessionId), JSON.stringify(state, null, 2), "utf8");
}

// -- Transcript parsing --

interface TranscriptEntry {
  type: string;
  message?: {
    role?: string;
    content?: string | Array<{ type: string; text?: string }>;
  };
}

function parseTranscript(raw: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as TranscriptEntry);
    } catch {
      /* skip malformed lines */
    }
  }
  return entries;
}

function extractUserMessages(entries: TranscriptEntry[]): string[] {
  const messages: string[] = [];
  for (const entry of entries) {
    if (!isUserEntry(entry)) continue;
    const content = entry.message?.content;
    if (typeof content === "string") {
      messages.push(content);
    } else if (Array.isArray(content)) {
      const text = content
        .filter((b) => b.type === "text" && b.text)
        .map((b) => b.text!)
        .join("\n");
      if (text) messages.push(text);
    }
  }
  return messages;
}

function entryToText(entry: TranscriptEntry): string {
  const role = entry.message?.role ?? entry.type;
  const content = entry.message?.content;
  let text: string;
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text!)
      .join("\n");
  } else {
    text = "";
  }
  return `[${role}]: ${text}`;
}

function condenseTranscript(entries: TranscriptEntry[], maxChars: number): string {
  const humanEntries: TranscriptEntry[] = [];
  const assistantEntries: TranscriptEntry[] = [];
  for (const entry of entries) {
    if (isUserEntry(entry)) {
      humanEntries.push(entry);
    } else if (entry.type === "assistant") {
      assistantEntries.push(entry);
    }
  }

  // Try full content first
  const allTexts = entries
    .filter((e) => isUserEntry(e) || e.type === "assistant")
    .map(entryToText);
  const full = allTexts.join("\n---\n");
  if (full.length <= maxChars) return full;

  // Remove oldest assistant entries first
  const remaining = [...assistantEntries];
  let humanTexts = humanEntries.map(entryToText);
  let assistantTexts: string[];

  while (remaining.length > 0) {
    remaining.shift();
    assistantTexts = remaining.map(entryToText);
    const combined = [...humanTexts, ...assistantTexts].join("\n---\n");
    if (combined.length <= maxChars) return combined;
  }

  // All assistant entries removed — truncate oldest user messages
  const humanList = [...humanEntries];
  while (humanList.length > 1) {
    humanList.shift();
    humanTexts = humanList.map(entryToText);
    const combined = humanTexts.join("\n---\n");
    if (combined.length <= maxChars) return combined;
  }

  // Last resort: truncate the single remaining message
  return humanTexts[0]?.slice(0, maxChars) ?? "";
}

// -- LLM prompts --

const EXTRACT_SYSTEM_PROMPT = `You are analyzing a conversation between a user and an AI coding assistant.
Extract all distinct requests, tasks, and intents the user expressed.

Return a JSON object:
{
  "intents": [
    { "id": 1, "description": "Brief description of the intent", "source": "quoted user text" }
  ]
}

Only include actionable requests. Exclude greetings, acknowledgments, and meta-conversation.`;

const VERIFY_SYSTEM_PROMPT = `You are verifying whether an AI coding assistant completed the user's requests.

For each intent, determine if it was SATISFIED or UNSATISFIED based on evidence
in the conversation. An intent is satisfied if the assistant took clear action
toward completing it and there's no indication of failure.

Return a JSON object:
{
  "results": [
    { "id": 1, "status": "satisfied" | "unsatisfied", "evidence": "brief explanation" }
  ]
}`;

async function extractIntents(userMessages: string[]): Promise<Intent[]> {
  const response = await chatCompletion(
    [
      { role: "system", content: EXTRACT_SYSTEM_PROMPT },
      { role: "user", content: "User messages:\n\n" + userMessages.join("\n\n---\n\n") },
    ],
    { responseFormat: { type: "json_object" } },
  );

  const parsed = JSON.parse(response.content) as { intents?: Intent[] };
  if (!Array.isArray(parsed.intents)) return [];
  return parsed.intents;
}

async function verifyIntents(
  intents: Intent[],
  condensedTranscript: string,
): Promise<VerificationResult[]> {
  const response = await chatCompletion(
    [
      { role: "system", content: VERIFY_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          `User intents:\n${JSON.stringify(intents, null, 2)}\n\n` +
          `Conversation transcript:\n${condensedTranscript}`,
      },
    ],
    { responseFormat: { type: "json_object" } },
  );

  const parsed = JSON.parse(response.content) as { results?: VerificationResult[] };
  if (!Array.isArray(parsed.results)) return [];
  return parsed.results;
}

// -- Main policy function --

export async function verifyIntent(ctx: PolicyContext): Promise<PolicyResult> {
  if (ctx.eventType !== "Stop") return allow();

  const sessionId = ctx.session?.sessionId;
  if (!sessionId) {
    hookLogWarn("verify-intent: no sessionId in payload, skipping");
    return allow();
  }

  const transcriptPath = ctx.session?.transcriptPath;
  if (!transcriptPath) {
    hookLogWarn("verify-intent: no transcriptPath in payload, skipping");
    return allow();
  }

  hookLogInfo(`verify-intent: session=${sessionId} transcript=${transcriptPath}`);

  // Check retry state
  const state = getRetryState(sessionId);
  hookLogInfo(`verify-intent: retryCount=${state.retryCount}/${MAX_RETRIES}`);
  if (state.retryCount >= MAX_RETRIES) {
    hookLogInfo(`verify-intent: max retries (${MAX_RETRIES}) reached, allowing stop`);
    return allow();
  }

  // Read transcript
  let raw: string;
  try {
    raw = await readFile(transcriptPath, "utf8");
  } catch (err) {
    hookLogWarn(`verify-intent: failed to read transcript at ${transcriptPath}: ${err instanceof Error ? err.message : String(err)}`);
    return allow();
  }

  const entries = parseTranscript(raw);
  const typeCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});
  hookLogInfo(`verify-intent: transcript parsed — ${entries.length} entries, types: ${JSON.stringify(typeCounts)}`);

  const userMessages = extractUserMessages(entries);
  if (userMessages.length === 0) {
    hookLogWarn(`verify-intent: no user messages found — entry types seen: ${JSON.stringify(typeCounts)}`);
    return allow();
  }
  hookLogInfo(`verify-intent: found ${userMessages.length} user message(s)`);

  try {
    // Pass 1: Extract intents
    hookLogInfo("verify-intent: Pass 1 — extracting intents from user messages");
    const intents = await extractIntents(userMessages);
    hookLogInfo(`verify-intent: Pass 1 done — extracted ${intents.length} intent(s)`);
    if (intents.length === 0) {
      hookLogInfo("verify-intent: no actionable intents found, allowing stop");
      return allow();
    }

    // Pass 2: Verify intents
    hookLogInfo(`verify-intent: Pass 2 — verifying ${intents.length} intent(s) against transcript`);
    const condensed = condenseTranscript(entries, MAX_TRANSCRIPT_CHARS);
    hookLogInfo(`verify-intent: condensed transcript length=${condensed.length} chars`);
    const results = await verifyIntents(intents, condensed);
    hookLogInfo(`verify-intent: Pass 2 done — ${results.length} result(s) received`);

    const unsatisfied = results.filter((r) => r.status === "unsatisfied");
    const satisfied = results.filter((r) => r.status === "satisfied");
    hookLogInfo(`verify-intent: ${satisfied.length} satisfied, ${unsatisfied.length} unsatisfied`);

    if (unsatisfied.length === 0) {
      hookLogInfo("verify-intent: all intents satisfied, allowing stop");
      return allow();
    }

    // Unsatisfied intents found — instruct Claude to continue
    const newRetryCount = state.retryCount + 1;
    saveRetryState(sessionId, {
      sessionId,
      retryCount: newRetryCount,
      lastCheckedAt: Date.now(),
      unsatisfiedIntents: unsatisfied,
    });

    const intentList = unsatisfied
      .map((u) => {
        const intent = intents.find((i) => i.id === u.id);
        return `${u.id}. ${intent?.description ?? "Unknown"} - ${u.evidence}`;
      })
      .join("\n");

    hookLogInfo(`verify-intent: blocking stop — ${unsatisfied.length} unsatisfied intent(s) (attempt ${newRetryCount}/${MAX_RETRIES})`);

    return instruct(
      `STOP: The following user requests have not been completed:\n${intentList}\n\nPlease address these before finishing. (Attempt ${newRetryCount}/${MAX_RETRIES})`,
    );
  } catch (err) {
    hookLogError(`verify-intent: LLM call failed: ${err instanceof Error ? err.message : String(err)}`);
    return allow();
  }
}
