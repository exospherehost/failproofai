/**
 * Hook event handler — invoked when Claude Code triggers a hook.
 *
 * Reads the JSON payload from stdin, loads enabled policies from
 * ~/.failproofai/policies-config.json, evaluates matching policies, persists
 * activity to disk, and returns the appropriate exit code + stdout response.
 */
import type { HookEventType, SessionMetadata, IntegrationType } from "./types";
import { COPILOT_EVENT_MAP, CODEX_HOOK_EVENT_TYPES, GEMINI_HOOK_EVENT_TYPES, COPILOT_HOOK_EVENT_TYPES, HOOK_EVENT_TYPES } from "./types";
import type { PolicyFunction, PolicyResult } from "./policy-types";
import { readMergedHooksConfig } from "./hooks-config";
import { registerBuiltinPolicies } from "./builtin-policies";
import { evaluatePolicies } from "./policy-evaluator";
import { clearPolicies, registerPolicy } from "./policy-registry";
import { loadAllCustomHooks } from "./custom-hooks-loader";
import type { CustomHook } from "./policy-types";
import { persistHookActivity } from "./hook-activity-store";
import { trackHookEvent } from "./hook-telemetry";
import { getInstanceId } from "../../lib/telemetry-id";
import { hookLogInfo, hookLogWarn } from "./hook-logger";
import { getIntegration, INTEGRATIONS } from "./integrations";
import { getClaudeProjectsPath, encodeCwd } from "../../lib/paths";
import type { HookActivityEntry } from "./hook-activity-store";

import { createHash, randomUUID } from "node:crypto";

const DEDUP_BUCKET_MS = 2000; // 2s time buckets (4-6s total lookback)
const DEDUP_DIR = join(homedir(), ".failproofai", "cache", "dedup");

function ensureDedupDir(): void {
  try {
    if (!existsSync(DEDUP_DIR)) {
      mkdirSync(DEDUP_DIR, { recursive: true });
    }
  } catch {
    // Best-effort directory management
  }
}

function getPayloadFingerprint(parsed: Record<string, unknown>): string {
  // Identity-defining fields that uniquely identify a "firing" from the IDE.
  // We trim strings to prevent slight whitespace drift from causing fingerprint mismatch.
  const trim = (v: any) => (typeof v === "string" ? v.trim() : v);
  const identity = {
    t: trim(parsed.tool_name),
    i: parsed.tool_input,
    p: trim(parsed.prompt),
    m: trim(parsed.message),
    c: (parsed.command as string || "").split(" ")[0].trim(),
    f: trim(parsed.file_path || parsed.path),
  };
  return createHash("sha256").update(JSON.stringify(identity)).digest("hex");
}

function getDedupeKey(
  integration: string | undefined,
  eventType: string,
  sessionId: string | undefined,
  fingerprint: string,
  bucket: number
): string {
  // Session ID is the strongest identity for a user action.
  // We use event-type aware signatures:
  // - Tool events (Pre/Post) need the fingerprint to allow multiple distinct calls in a session.
  // - Flow events (Start, Stop, Prompt) are singletons per session per 4s window.
  // This collapses IDE UI-meta-messages (e.g. 'Waiting for input') into the actual user action.
  const isTool = eventType.includes("Tool");
  const identityTag = sessionId ?? integration ?? "unknown";

  const signatureParts = [eventType, identityTag];
  if (isTool) {
    signatureParts.push(fingerprint);
  }

  const signature = signatureParts.join("|");

  const hash = createHash("sha256").update(signature).digest("hex");
  return `${hash}-${bucket}`;
}

/**
 * Atomic deduplication: checks lookback and attempts to claim the current bucket.
 * Returns true if this is a fresh event (should persist), false if it's a duplicate.
 */
function tryRecordEvent(
  integration: string | undefined,
  eventType: string,
  sessionId: string | undefined,
  fingerprint: string,
  windowMs: number = DEDUP_BUCKET_MS // Default to standard 2s bucket
): boolean {
  ensureDedupDir();
  const now = Date.now();
  const bucketSize = windowMs;
  const currentBucket = Math.floor(now / bucketSize);

  // 1. Double Bucket Lookback (Boundary catch)
  // Checking current and prev ensures we catch boundary overlaps
  const bucketsToCheck = [currentBucket, currentBucket - 1];
  
  for (const bucket of bucketsToCheck) {
    const key = getDedupeKey(integration, eventType, sessionId, fingerprint, bucket);
    const p = join(DEDUP_DIR, `${key}.lock`);
    if (existsSync(p)) return false;
  }

  // 2. Atomic Recording
  const currentKey = getDedupeKey(integration, eventType, sessionId, fingerprint, currentBucket);
  const currentPath = join(DEDUP_DIR, `${currentKey}.lock`);

  try {
    writeFileSync(currentPath, now.toString(), { flag: "wx" });
    return true;
  } catch (e) {
    if ((e as any).code === "EEXIST") return false; 
    return true; // Fallback to allowing on other FS errors
  }
}

// For testing: reset deduplication state
export function _resetDedupeCache(): void {
  try {
    if (existsSync(DEDUP_DIR)) {
      require("node:fs").rmSync(DEDUP_DIR, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors in tests
  }
}

/**
 * Early-exit lock (Instant Catch)
 * Checks for a recent firing of the same event+session and takes the lock.
 * Returns true if this process is the winner and should proceed.
 */
function tryAcquireFiringLock(eventType: string, sessionId: string | undefined, fingerprint?: string): boolean {
  if (!sessionId) return true; // Can't safely deduplicate without session

  const lockDir = join(DEDUP_DIR, "firing-locks");
  if (!existsSync(lockDir)) {
    try { mkdirSync(lockDir, { recursive: true }); } catch { /* ignore */ }
  }

  // Identity is based on event type + session ID.
  // For tool events, we also include the fingerprint of the command/input.
  const isTool = eventType?.toLowerCase().includes("tool");
  const signatureParts = [eventType, sessionId];
  if (isTool && fingerprint) {
    signatureParts.push(fingerprint);
  }

  // Use a 5-second bucket to ensure the lock only applies to near-simultaneous firings (twins).
  // This prevents stale locks from previous runs/tests from blocking fresh operations.
  const bucket = Math.floor(Date.now() / 5000);
  const signature = signatureParts.join("|") + `|${bucket}`;
  const identity = createHash("sha256").update(signature).digest("hex");
  const lockPath = join(lockDir, `${identity}.lock`);

  // Check if lock exists (bucket ensured it's recent)
  if (existsSync(lockPath)) {
    return false; // Twin already ran in this 5s window
  }

  // Acquire lock: atomic exclusive-create. `wx` fails with EEXIST if a twin
  // process got here first — that's how we make this a real lock instead of a
  // racy overwrite.
  try {
    writeFileSync(lockPath, String(process.pid), { flag: "wx" });
    return true;
  } catch (e) {
    if ((e as any).code === "EEXIST") return false;
    return false;
  }
}

interface VirtualLogState {
  lastUuid: string | null;
  pendingTools: Record<string, string>;
}

/**
 * Writes a proper LogEntry-shaped line to the virtual project log for non-Claude integrations.
 * Uses a small sidecar (.state.json) to thread UUIDs and tool_use IDs across separate
 * PreToolUse / PostToolUse hook process invocations, so parseFileContent can enrich
 * tool_use blocks with their results exactly like a real Claude Code transcript.
 */
export function writeVirtualLogEntry(
  logPath: string,
  eventType: string,
  parsed: Record<string, unknown>,
): void {
  const sidecarPath = `${logPath}.state.json`;

  let state: VirtualLogState = { lastUuid: null, pendingTools: {} };
  try {
    state = JSON.parse(readFileSync(sidecarPath, "utf-8")) as VirtualLogState;
  } catch { /* fresh session or unreadable — start clean */ }

  const newUuid = randomUUID();
  const timestamp = new Date().toISOString();
  let logLine: string | null = null;

  if (eventType === "UserPromptSubmit") {
    const toolInput = parsed.tool_input as Record<string, unknown> | string | undefined;
    const prompt = (
      typeof toolInput === "string" ? toolInput
        : ((toolInput?.user_prompt ?? toolInput?.prompt ?? parsed.prompt ?? "") as string)
    ).trim();
    if (!prompt) return;

    logLine = JSON.stringify({
      type: "user",
      uuid: newUuid,
      parentUuid: state.lastUuid,
      timestamp,
      message: { role: "user", content: prompt },
    });
    state.lastUuid = newUuid;

  } else if (eventType === "PreToolUse") {
    const toolName = (parsed.tool_name as string) || "unknown_tool";
    const toolInput = (parsed.tool_input as Record<string, unknown>) || {};
    const toolUseId = `toolu_virt_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

    const inputKey = `${toolName}:${JSON.stringify(toolInput).slice(0, 300)}`;
    state.pendingTools[inputKey] = toolUseId;
    // Prevent unbounded growth on very long sessions
    const keys = Object.keys(state.pendingTools);
    if (keys.length > 50) delete state.pendingTools[keys[0]];

    logLine = JSON.stringify({
      type: "assistant",
      uuid: newUuid,
      parentUuid: state.lastUuid,
      timestamp,
      message: {
        role: "assistant",
        content: [{ type: "tool_use", id: toolUseId, name: toolName, input: toolInput }],
      },
    });
    state.lastUuid = newUuid;

  } else if (eventType === "PostToolUse") {
    const toolName = (parsed.tool_name as string) || "unknown_tool";
    const toolInput = (parsed.tool_input as Record<string, unknown>) || {};
    const toolOutput = ((parsed.tool_response ?? parsed.output ?? parsed.tool_result ?? "") as string);

    const inputKey = `${toolName}:${JSON.stringify(toolInput).slice(0, 300)}`;
    const toolUseId = state.pendingTools[inputKey];
    if (!toolUseId) return; // orphaned PostToolUse — no matching Pre
    delete state.pendingTools[inputKey];

    logLine = JSON.stringify({
      type: "user",
      uuid: newUuid,
      parentUuid: state.lastUuid,
      timestamp,
      message: {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: toolUseId, content: toolOutput }],
      },
    });
    state.lastUuid = newUuid;
  }

  if (logLine) {
    appendFileSync(logPath, logLine + "\n");
    try { writeFileSync(sidecarPath, JSON.stringify(state), "utf-8"); } catch { /* non-fatal */ }
  }
}

export async function handleHookEvent(eventType: string, integrationOverride?: string): Promise<{ exitCode: number; hardStop: boolean }> {
  // SILENCE GUARD: If a hook is EXPLICITLY labeled as Claude but the event name 
  // is unique to Gemini/Copilot, it means we have a duplicate legacy hook firing 
  // from an old installation. SILENTLY ABORT to avoid duplicate/incorrect logs.
  // Note: We only silence if the flag is explicitly 'claude-code'. If it's 
  // missing, we let it fall through to the detection logic.
  if (integrationOverride === "claude-code") {
    const isGeminiUnique = GEMINI_HOOK_EVENT_TYPES.includes(eventType as any) && !HOOK_EVENT_TYPES.includes(eventType as any);
    const isCopilotUnique = COPILOT_HOOK_EVENT_TYPES.includes(eventType as any) && !HOOK_EVENT_TYPES.includes(eventType as any);
    
    if (isGeminiUnique || isCopilotUnique) {
      return { exitCode: 0, hardStop: false };
    }
  }

  // 1. Read stdin payload
  const MAX_STDIN_BYTES = 1_048_576; // 1 MB
  let payload = "";
  try {
    payload = await new Promise<string>((resolve, reject) => {
      const chunks: string[] = [];
      let totalBytes = 0;
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk: string) => {
        totalBytes += Buffer.byteLength(chunk);
        if (totalBytes > MAX_STDIN_BYTES) {
          hookLogWarn(`stdin payload exceeds 1 MB for ${eventType}, discarding`);
          process.stdin.destroy();
          resolve("");
          return;
        }
        chunks.push(chunk);
      });
      process.stdin.on("end", () => resolve(chunks.join("")));

      // Handle the case where stdin is not a pipe or is empty
      setTimeout(() => {
        if (chunks.length === 0) resolve("");
      }, 500); // 500ms timeout for slow pipes

      process.stdin.on("error", reject);
      if (process.stdin.readableEnded) resolve("");
    });
  } catch {
    hookLogWarn(`stdin read failed for ${eventType}`);
  }

  let parsed: Record<string, unknown> = {};
  if (payload) {
    try {
      parsed = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      hookLogWarn(`payload parse failed for ${eventType} (${payload.length} bytes)`);
    }
  }

  // 2. Integration Detection & Normalization

  // PRIMARY SOURCE OF TRUTH: the explicit --integration CLI flag (or payload.integration).
  // The hook entries we install always include this flag, so it's the most reliable signal.
  let integrationType: IntegrationType | undefined =
    (integrationOverride as IntegrationType) || (parsed.integration as IntegrationType);

  // Unique-event-name fallback (only for events truly unique to one integration;
  // avoid shared names like SessionStart/SessionEnd that multiple integrations emit).
  if (!integrationType) {
    const GEMINI_UNIQUE = ["BeforeTool", "AfterTool", "BeforeAgent", "AfterAgent", "BeforeModel", "AfterModel", "BeforeToolSelection", "PreCompress"];
    if (GEMINI_UNIQUE.includes(eventType)) {
      integrationType = "gemini";
    } else if (COPILOT_HOOK_EVENT_TYPES.includes(eventType as any) && !HOOK_EVENT_TYPES.includes(eventType as any)) {
      // camelCase event names are the unique signature of Copilot/Cursor.
      // PascalCase SessionStart/SessionEnd are shared by Claude/Gemini.
      // We check that the event is NOT in the standard Claude/Gemini PascalCase list.
      integrationType = "copilot";
    } else if (CODEX_HOOK_EVENT_TYPES.includes(eventType as any)) {
      integrationType = "codex";
    }
  }

  // Secondary Detection: Payload-based (Stdin)
  if (!integrationType) {
    if (INTEGRATIONS.copilot.detect(parsed)) {
      integrationType = "copilot";
    } else if (INTEGRATIONS.gemini.detect(parsed)) {
      integrationType = "gemini";
    } else if (INTEGRATIONS.cursor.detect(parsed)) {
      integrationType = "cursor";
    } else if (INTEGRATIONS.opencode.detect(parsed)) {
      integrationType = "opencode";
    } else if (INTEGRATIONS.pi.detect(parsed)) {
      integrationType = "pi";
    }

    if (!integrationType) {
      integrationType = "claude-code";
    }
  }

  // Helper for safe integration retrieval
  const getInteg = (type: IntegrationType) => {
    try { return getIntegration(type); } catch { return getIntegration("claude-code"); }
  };

  const integ = getInteg(integrationType);
  integ.normalizePayload(parsed);
  const canonicalEventName = integ.getCanonicalEventName(parsed, eventType);

  // 3. Session Extraction & Fingerprinting
  const fingerprint = getPayloadFingerprint(parsed);
  
  // Extract sessionId with broad compatibility (camelCase, snake_case, PascalCase variants)
  // and Environment Variable Recovery (for empty payloads)
  const extractedSessionId = 
    (parsed.session_id as string | undefined) || 
    (parsed.sessionId as string | undefined) || 
    (parsed.sessionID as string | undefined) ||
    (parsed.conversation_id as string | undefined) ||
    (parsed.conversationID as string | undefined) ||
    (parsed.chat_id as string | undefined) ||
    (parsed.chatId as string | undefined) ||
    (parsed.tab_id as string | undefined) ||
    (parsed.tabId as string | undefined) ||
    ((parsed.data as any)?.session_id as string | undefined) ||
    ((parsed.data as any)?.sessionId as string | undefined) ||
    ((parsed.data as any)?.sessionID as string | undefined) ||
    ((parsed.data as any)?.conversationID as string | undefined) ||
    ((parsed.data as any)?.chatId as string | undefined) ||
    // Environment Recovery: Catch headless agents (Prioritize Copilot for camelCase events)
    (integrationType === "copilot" ? process.env.COPILOT_SESSION_ID || process.env.COPILOT_CMD_ID : undefined) ||
    process.env.CURSOR_SESSION_ID ||
    process.env.CLAUDE_SESSION_ID ||
    process.env.GEMINI_SESSION_ID ||
    process.env.PI_SESSION_ID ||
    process.env.COPILOT_SESSION_ID ||
    process.env.COPILOT_CMD_ID;

  let finalCwd = parsed.cwd as string | undefined;
  // Prioritize PWD (actual terminal location) over process.cwd() (often workspace root)
  const physicalCwd = process.env.PWD || process.cwd();

  // Hyper-Specific Attribution: 
  // 1. If we found a more specific CWD in the tool input (via normalizePayload), prioritize it
  // 2. Otherwise, check if physical CWD is a sub-directory of the agent-reported root
  if (physicalCwd && finalCwd && physicalCwd !== finalCwd) {
    const rel = relative(finalCwd, physicalCwd);
    if (rel && !rel.startsWith("..") && !isAbsolute(rel)) {
      finalCwd = physicalCwd;
    }
  }

  const fallbackSessionId = `session-${integrationType}-${(finalCwd || "default").split("/").filter(Boolean).pop() || "root"}`;

  const session: SessionMetadata = {
    sessionId: extractedSessionId || fallbackSessionId,
    transcriptPath: parsed.transcript_path as string | undefined,
    cwd: finalCwd,
    permissionMode: parsed.permission_mode as string | undefined,
    hookEventName: parsed.hook_event_name as string | undefined,
    integration: integrationType || "claude-code",
  };

  // Instant Catch - Exit if we already saw this firing in another scope
  if (!tryAcquireFiringLock(canonicalEventName, session.sessionId, fingerprint)) {
    hookLogInfo(`event=${eventType} skipped (instant-catch twin)`);
    
    // For IDE integrations, we exit silently (0) to let the "twin" 
    // process handle the authoritative decision. We do NOT output 
    // an explicit "allow" JSON here, as that could bypass a "deny"
    // from the primary hook process.
    return { exitCode: 0, hardStop: false };
  }

  if (!payload && session.integration === "cursor") {
    hookLogWarn(`stdin is empty for ${eventType} - Cursor Agent might not be piping context`);
  }

  const startTime = performance.now();

  // Build transcriptPath for Copilot sessions — Copilot payloads don't include one,
  // so derive it from the session ID pointing to Copilot's own event log.
  if (integrationType === "copilot" && session.sessionId && !session.transcriptPath) {
    session.transcriptPath = join(homedir(), ".copilot", "session-state", session.sessionId, "events.jsonl");
  }

  // Load enabled policies (merge across project/local/global scopes)
  const config = readMergedHooksConfig(session.cwd);
  clearPolicies();
  registerBuiltinPolicies(config.enabledPolicies);

  // Load and register custom hooks (layer 2, after builtins)
  const loadResult = await loadAllCustomHooks(config.customPoliciesPath, { sessionCwd: session.cwd });
  const customHooksList = loadResult.hooks;
  const conventionHookNames = new Set(loadResult.conventionSources.flatMap((s) => s.hookNames));

  for (const hook of customHooksList) {
    const hookName = hook.name;
    const conventionScope = (hook as CustomHook & { __conventionScope?: string }).__conventionScope;
    const isConvention = !!conventionScope;
    const prefix = isConvention ? `.failproofai-${conventionScope}` : "custom";
    const fn: PolicyFunction = async (ctx): Promise<PolicyResult> => {
      try {
        const result = await Promise.race([
          hook.fn(ctx),
          new Promise<PolicyResult>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 10_000),
          ),
        ]);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isTimeout = msg === "timeout";
        hookLogWarn(`${prefix} hook "${hookName}" failed: ${msg}`);
        void trackHookEvent(getInstanceId(), "custom_hook_error", {
          hook_name: hookName,
          error_type: isTimeout ? "timeout" : "exception",
          event_type: eventType,
          is_convention_policy: isConvention,
          convention_scope: conventionScope ?? null,
        });
        return { decision: "allow" };
      }
    };
    registerPolicy(
      `${prefix}/${hookName}`,
      hook.description ?? "",
      fn,
      hook.match ?? {},
      -1, // Custom hooks run after builtins (priority 0)
    );
  }

  // Fire telemetry once per invocation for custom hook loads
  if (customHooksList.length > 0) {
    void trackHookEvent(getInstanceId(), "custom_hooks_loaded", {
      custom_hooks_count: customHooksList.length,
      custom_hook_names: customHooksList.map((h) => h.name),
      event_types_covered: [...new Set(customHooksList.flatMap((h) => h.match?.events ?? []))],
    });
  }

  // Fire telemetry for convention-based policy discovery
  if (loadResult.conventionSources.length > 0) {
    void trackHookEvent(getInstanceId(), "convention_policies_loaded", {
      event_type: eventType,
      project_file_count: loadResult.conventionSources.filter((s) => s.scope === "project").length,
      user_file_count: loadResult.conventionSources.filter((s) => s.scope === "user").length,
      convention_hook_count: conventionHookNames.size,
      convention_hook_names: [...conventionHookNames],
    });
  }

  hookLogInfo(`event=${eventType} policies=${config.enabledPolicies.length} custom=${customHooksList.length} convention=${conventionHookNames.size}`);

  // Evaluate policies
  const result = await evaluatePolicies(canonicalEventName as HookEventType, parsed, session, config);
  const durationMs = Math.round(performance.now() - startTime);
  hookLogInfo(`result=${result.decision} policy=${result.policyName ?? "none"} duration=${durationMs}ms`);

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  // Persist activity to disk (visible in /policies activity tab)
  const activityEntry = {
    timestamp: Date.now(),
    eventType,
    toolName: (parsed.tool_name as string) ?? null,
    policyName: result.policyName,
    policyNames: result.policyNames,
    decision: result.decision,
    reason: result.reason,
    durationMs,
    sessionId: session.sessionId,
    transcriptPath: session.transcriptPath,
    cwd: session.cwd,
    permissionMode: session.permissionMode,
    hookEventName: session.hookEventName,
  };
  try {
    persistHookActivity(activityEntry);
  } catch {
    hookLogWarn("activity persistence failed");
  }

  // Enqueue for server relay — fire-and-forget, never blocks hook.
  // queue.ts is a no-op if the user is not logged in (no auth.json), and
  // sanitizes the entry before persisting (drops toolInput/transcriptPath,
  // hashes cwd, redacts known secret patterns in `reason`).
  try {
    const { appendToServerQueue } = await import("../relay/queue");
    appendToServerQueue(activityEntry);
  } catch {
    // Server queue is best-effort; fail-open
  }

  // Lazy-start relay daemon if user is logged in — ~1ms when already running
  try {
    const { ensureRelayRunning } = await import("../relay/daemon");
    ensureRelayRunning();
  } catch {
    // Relay is best-effort; hook must succeed regardless
  }

  // Fire PostHog telemetry for decisions that affect Claude's behavior
  if (result.decision === "deny" || result.decision === "instruct") {
    try {
      const isCustomHook = result.policyName?.startsWith("custom/") ?? false;
      const isConventionPolicy = result.policyName?.startsWith(".failproofai-") ?? false;
      const conventionScope = isConventionPolicy
        ? result.policyName!.match(/^\.failproofai-(project|user)\//)?.[1] ?? null
        : null;
      const hasCustomParams =
        !isCustomHook && !isConventionPolicy && !!(result.policyName && config.policyParams?.[result.policyName]);
      const paramKeysOverridden = hasCustomParams
        ? Object.keys(config.policyParams![result.policyName!])
        : [];
      const distinctId = getInstanceId();
      await trackHookEvent(distinctId, "hook_policy_triggered", {
        event_type: canonicalEventName,
        tool_name: (parsed.tool_name as string) ?? null,
        policy_name: result.policyName,
        decision: result.decision,
        is_custom_hook: isCustomHook,
        is_convention_policy: isConventionPolicy,
        convention_scope: conventionScope,
        has_custom_params: hasCustomParams,
        param_keys_overridden: paramKeysOverridden,
      });
    } catch {
      // Telemetry is best-effort — never block the hook
    }
  }

  if (result.hardStop && process.env.FAILPROOFAI_SKIP_KILL !== "true") {
    // Session-level Hard Stop for Gemini/Cursor.
    // We use a small delay to ensure stdout (JSON denial) is flushed to the agent 
    // before we terminate the process group.
    setTimeout(() => {
      try {
        // Negative PID signals the entire process group
        process.kill(-process.ppid, "SIGINT");
      } catch {
        try { process.kill(process.ppid, "SIGINT"); } catch {}
      }
    }, 50);
  }

  return { exitCode: result.exitCode, hardStop: !!result.hardStop };
}
