# Improved Integration Plan: Gemini CLI + GitHub Copilot

> [!NOTE]
> **V2 IMPROVEMENTS**: This plan introduces a modular architecture where each integration (Claude, Cursor, Gemini, Copilot) owns its own detection and normalization logic. This fixes 5 existing bugs and adds deep regression guards for Claude/Cursor.

---

## Known Bugs in the Previous Plan (Read First)

| Bug | Severity | Root Cause | Fixed In Phase |
|---|---|---|---|
| **1. Detection Collision** | **CRITICAL** | Gemini's `SessionStart` overlaps with Claude Code. | Phase 3 (Modular Detection) |
| **2. Raw Event Logging** | **MEDIUM** | Logs used raw `--hook` arg instead of mapped canonical names. | Phase 3 (Canonical Mapping) |
| **3. Log Formatting** | **LOW** | Disconnect between console output and actual evaluation name. | Phase 3 (Unified Logging) |
| **4. Copilot Deny Branch** | **LOW** | Missing specific block format for `PostToolUse`. | Phase 4 (Evaluator) |
| **5. Copilot Allow Spam** | **MEDIUM** | `permissionDecision: allow` was sent on every single event. | Phase 4 (Evaluator) |
| **6. Cursor Normalization** | **MEDIUM** | Hardcoded `workspace_roots` check in handler was fragile. | Phase 2 (Modular Integration) |

---

## 1. Modular Architecture Overview

Instead of hardcoding "integration detection" in the main handler, we extend the `Integration` interface:

```typescript
export interface Integration {
  // ... existing methods ...
  /** Detect if this payload belongs to this integration */
  detect(payload: Record<string, unknown>): boolean;
  /** Normalize payload fields (e.g. camelCase -> snake_case) */
  normalizePayload(payload: Record<string, unknown>): void;
  /** Map raw hook names to canonical PascalCase (PreToolUse, etc.) */
  getCanonicalEventName(payload: Record<string, unknown>, cliArg: string): string;
}
```

### Flow:
1. `handler.ts` receives payload.
2. Iterates over `INTEGRATIONS.detect(payload)`.
3. First match wins (Copilot -> Gemini -> Cursor -> Claude Code).
4. `integration.normalizePayload(payload)` is called.
5. `integration.getCanonicalEventName(payload, cliArg)` is called.
6. Execution proceeds with perfectly clean, canonical state.

---

## Phase 1 — `src/hooks/types.ts`

**Changes**: Add `"gemini"` and `"copilot"` to `INTEGRATION_TYPES`. Add Gemini/Copilot event maps and types.

Update [types.ts](file:///home/yashu/fp/failproofai/src/hooks/types.ts):

```typescript
// Line 8:
export const INTEGRATION_TYPES = ["claude-code", "cursor", "gemini", "copilot"] as const;

// ... Append at end of file ...

// ── Gemini CLI ────────────────────────────────────────────────────────────────
export const GEMINI_HOOK_EVENT_TYPES = [
  "BeforeTool", "AfterTool", "BeforeAgent", "AfterAgent", "BeforeModel",
  "AfterModel", "BeforeToolSelection", "SessionStart", "SessionEnd",
  "Notification", "PreCompress"
] as const;

export type GeminiHookEventType = (typeof GEMINI_HOOK_EVENT_TYPES)[number];

export const GEMINI_EVENT_MAP: Record<GeminiHookEventType, string> = {
  BeforeTool: "PreToolUse", AfterTool: "PostToolUse",
  BeforeAgent: "SessionStart", AfterAgent: "Stop",
  BeforeModel: "UserPromptSubmit", AfterModel: "PostToolUse",
  BeforeToolSelection: "PreToolUse", SessionStart: "SessionStart",
  SessionEnd: "SessionEnd", Notification: "Notification",
  PreCompress: "PreCompact",
};

// ── GitHub Copilot ────────────────────────────────────────────────────────────
export const COPILOT_HOOK_EVENT_TYPES = [
  "sessionStart", "sessionEnd", "userPromptSubmitted",
  "preToolUse", "postToolUse", "agentStop", "subagentStop", "errorOccurred"
] as const;

export type CopilotHookEventType = (typeof COPILOT_HOOK_EVENT_TYPES)[number];

export const COPILOT_EVENT_MAP: Record<CopilotHookEventType, string> = {
  sessionStart: "SessionStart", sessionEnd: "SessionEnd",
  userPromptSubmitted: "UserPromptSubmit", preToolUse: "PreToolUse",
  postToolUse: "PostToolUse", agentStop: "Stop",
  subagentStop: "SubagentStop", errorOccurred: "Stop",
};
```

---

## Phase 2 — `src/hooks/integrations.ts`

**Changes**: Update `Integration` interface and implement new methods for all four integrations.

### 2.1 Interface Update
```typescript
export interface Integration {
  // ... (existing methods: getSettingsPath, readSettings, etc.) ...
  detect(payload: Record<string, unknown>): boolean;
  normalizePayload(payload: Record<string, unknown>): void;
  getCanonicalEventName(payload: Record<string, unknown>, cliArg: string): string;
}
```

### 2.2 Claude Code Implementation
```typescript
const claudeCode: Integration = {
  // ... existing ...
  detect: () => true, // Fallback
  normalizePayload: () => {}, // Claude uses snake_case natively
  getCanonicalEventName: (_, cliArg) => cliArg,
};
```

### 2.3 Cursor Implementation (Modularized)
```typescript
const cursor: Integration = {
  // ... existing ...
  detect(payload) {
    const hookName = (payload.hook_event_name as string) || "";
    return (
      Array.isArray(payload.workspace_roots) ||
      hookName.startsWith("before") ||
      hookName.startsWith("after") ||
      hookName === "preToolUse" ||
      hookName === "postToolUse"
    );
  },
  normalizePayload(payload) {
    if (!payload.cwd && Array.isArray(payload.workspace_roots) && payload.workspace_roots.length > 0) {
      payload.cwd = payload.workspace_roots[0];
    }
  },
  getCanonicalEventName: (_, cliArg) => cliArg,
};
```

### 2.4 Gemini Implementation
```typescript
const gemini: Integration = {
  // ... existing ...
  detect(payload) {
    const h = payload.hook_event_name as string;
    // Exclusive detection: avoid SessionStart/SessionEnd collisions
    return ["BeforeTool", "AfterTool", "BeforeAgent", "AfterAgent", "BeforeModel", "AfterModel", "BeforeToolSelection"].includes(h);
  },
  normalizePayload: () => {}, // Gemini uses snake_case
  getCanonicalEventName(payload, cliArg) {
    const h = payload.hook_event_name as GeminiHookEventType;
    return GEMINI_EVENT_MAP[h] ?? cliArg;
  }
};
```

---

## Phase 3 — `src/hooks/handler.ts` (Modularized)

**Changes**: Clean up the detection logic and fix logging bugs.

```typescript
// ... Inside handleHookEvent ...

  // 1. Modular Detection
  let integrationType: IntegrationType = (parsed.integration as IntegrationType);
  if (!integrationType) {
    // Priority: Copilot -> Gemini -> Cursor -> Claude Code (default)
    if (copilot.detect(parsed)) integrationType = "copilot";
    else if (gemini.detect(parsed)) integrationType = "gemini";
    else if (cursor.detect(parsed)) integrationType = "cursor";
    else integrationType = "claude-code";
  }

  const integ = getIntegration(integrationType);

  // 2. Modular Normalization
  integ.normalizePayload(parsed);

  // 3. Modular Canonical Mapping (Fix Bug 1, 2, 3)
  const canonicalEventName = integ.getCanonicalEventName(parsed, eventType);

  // 4. Update session metadata
  const session: SessionMetadata = {
    sessionId: parsed.session_id as string,
    integration: integrationType,
    // ... other fields ...
  };

  hookLogInfo(`event=${canonicalEventName} integration=${integrationType} ...`);

  // 5. Evaluate (Fix Bug 2)
  const result = await evaluatePolicies(canonicalEventName as HookEventType, parsed, session, config);

  // 6. Persist (Fix Bug 2)
  persistHookActivity({
    ...result,
    eventType: canonicalEventName,
    integration: integrationType,
  });
```

---

## Phase 4 — `src/hooks/policy-evaluator.ts`

**Changes**: Fix Bug 4 & 5 and format Gemini action blocks.

```typescript
// Line 39: Empty policy final allow (Fix Bug 5)
if (policies.length === 0) {
  let stdout = "";
  if (session?.integration === "cursor") {
    stdout = JSON.stringify({ continue: true, permission: "allow" });
  } else if (session?.integration === "copilot" && eventType === "PreToolUse") {
    stdout = JSON.stringify({ permissionDecision: "allow" });
  }
  return { exitCode: 0, stdout, ... };
}

// Inside PreToolUse deny (Add Gemini action: "BLOCK")
if (session?.integration === "gemini") {
  return {
    exitCode: 0,
    stdout: JSON.stringify({ action: "BLOCK", reason: blockMessage }),
    ...
  };
}
```

---

## Phase 9 — Regression Suite (New Phase)

To ensure no impact on Claude Code or Cursor:

1. **Claude Regression**: Mock a "Bash" tool event from Claude.
   - Verify `integration === "claude-code"`.
   - Verify `canonicalEventName === "PreToolUse"`.
   - Verify empty stdout on allow.

2. **Cursor Regression**: Mock a `workspace_roots` payload.
   - Verify `integration === "cursor"`.
   - Verify `parsed.cwd` is correctly extracted from `workspace_roots[0]`.
   - Verify `stdout` contains `continue/permission` fields.

3. **Log Visibility**:
   - Verify that activity persisted for **both** Gemini and Copilot contains the `integration` field.
   - This ensures the Dashboard `/policies` activity tab correctly shows which integration triggered each block.

---

## Phase 10 — Manual Smoke Tests

```bash
# Gemini Allow Check
echo '{"hook_event_name":"BeforeTool","tool_name":"ls"}' | failproofai --hook PreToolUse
# Result: exit 0, empty stdout

# Copilot Deny Check (Simulate block)
# Force a deny policy (e.g. block-sudo)
echo '{"sessionId":"123","toolName":"sudo","hookEventName":"preToolUse"}' | failproofai --hook PreToolUse
# Result: exit 0, stdout = {"permissionDecision":"deny", ...}
```
