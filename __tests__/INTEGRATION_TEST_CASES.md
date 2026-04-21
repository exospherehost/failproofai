# Integration Test Cases — Non-Claude Integrations

A comprehensive checklist of edge cases the test suite must cover for every non-Claude
integration (Cursor, Gemini, GitHub Copilot, Codex, OpenCode, Pi). Cases are grouped by
layer — installation, hook firing, payload normalization, attribution, dashboard display,
and cross-cutting concerns. Each case is written as a testable assertion.

Symbols: ✅ = must-pass assertion, ⚠️ = regression guard (has broken before), 🔁 = parameterize across all integrations.

---

## 0. Index

1. [Installation & Uninstallation](#1-installation--uninstallation)
2. [Hook Command Format & Binary Resolution](#2-hook-command-format--binary-resolution)
3. [Event Firing & Trigger Reality](#3-event-firing--trigger-reality)
4. [Event Name Canonicalization](#4-event-name-canonicalization)
5. [Payload Normalization](#5-payload-normalization)
6. [Integration Detection & Attribution](#6-integration-detection--attribution)
7. [Session ID Extraction & Fallback](#7-session-id-extraction--fallback)
8. [Policy Evaluation per Integration](#8-policy-evaluation-per-integration)
9. [Deduplication](#9-deduplication)
10. [Persistence to hook-activity Store](#10-persistence-to-hook-activity-store)
11. [Dashboard Display Gaps](#11-dashboard-display-gaps)
12. [Sync & Merge Functions](#12-sync--merge-functions)
13. [Scopes: user / project / local](#13-scopes-user--project--local)
14. [Cross-Version Compatibility](#14-cross-version-compatibility)
15. [Integration-Specific Deep Cases](#15-integration-specific-deep-cases)

---

## 1. Installation & Uninstallation

🔁 For every integration {cursor, gemini, copilot, codex, opencode, pi}:

- ✅ `policies --install --integration <id>` writes the correct settings file at the correct path for each scope.
- ✅ Fresh install on a machine with **no prior config file** creates parent directories (e.g. `~/.copilot/`, `~/.config/github-copilot/hooks/`, `~/.gemini/`, `.github/hooks/`).
- ✅ Install **preserves existing user settings** in the same file (e.g. Copilot's `copilotTokens`, `loggedInUsers` must remain untouched after installing hooks).
- ⚠️ Re-running install is idempotent — no duplicate hook entries.
- ⚠️ Install followed by uninstall leaves the settings file in a state byte-identical to before install (modulo whitespace). No orphan `hooks: {}` block if none existed.
- ⚠️ Uninstall removes **only** failproofai entries, not other user-authored hooks.
- ⚠️ Install of integration A does not touch integration B's settings file.
- ✅ `policies --install all --integration <id>` enables all policy names and registers hooks for every event type in that integration's `eventTypes` list.
- ⚠️ Running uninstall with `--scope project` when **no project file exists** exits 0 gracefully.
- 🔁 `hooksInstalledInSettings(scope)` returns true iff any failproofai marker is present.
- ⚠️ **Copilot regression**: after user-scope install, `synchronizeCopilotProjectHooks` (postInstall) must not wipe the just-written user entries when no project file exists.

---

## 2. Hook Command Format & Binary Resolution

🔁 For each integration:

- ✅ Project-scope hook command uses portable `npx -y failproofai` (no machine-specific path) so the file is safe to commit.
- ✅ User-scope hook command uses absolute local binary path (`process.execPath` + resolved dist entry), so it works without `PATH` setup.
- ⚠️ `FAILPROOFAI_DIST_PATH` env var overrides the resolved binary path.
- ⚠️ When `FAILPROOFAI_DIST_PATH` is unset, `findDistIndex()` walks from the running binary's directory up to find `dist/`.
- ✅ Each installed command contains `--integration <id>` and `--hook <EventName>`.
- ⚠️ **Copilot regression**: event name in the command is native camelCase (`sessionStart`), NOT PascalCase.
- ⚠️ **Codex**: event name is snake_case (`pre_tool_use`).
- ⚠️ **Gemini**: event name is Gemini's unique PascalCase (`BeforeTool`, `BeforeModel`).
- ⚠️ **Cursor**: event name matches Cursor's native format; command includes `--stdin`.
- ⚠️ Shell-quoting: paths containing spaces are double-quoted in the generated bash.
- ⚠️ Windows path separators: on win32, binary path uses backslashes but is wrapped in quotes so bash can execute it.

---

## 3. Event Firing & Trigger Reality

🔁 For each integration: simulate each native event type and verify the hook handler is invoked.

- ✅ **Cursor**: `beforeShellExecution`, `afterFileEdit`, `beforeReadFile`, `beforeMCPExecution`, `stop` all fire via the JSONL pipe and produce one handler invocation each.
- ✅ **Gemini**: `BeforeTool`, `AfterTool`, `BeforeModel`, `AfterModel`, `BeforeAgent`, `AfterAgent`, `BeforeToolSelection`, `PreCompress` each fire.
- ✅ **Copilot**: `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`, `postToolUse`, `agentStop`, `subagentStop`, `errorOccurred` each fire.
- ✅ **Codex**: `pre_tool_use`, `post_tool_use`, `session_start`, `session_end`, `user_prompt_submitted`, `agent_stop`, `notification` each fire.
- ✅ **OpenCode**: dotted events (`tool.before`, `tool.after`, `session.start`, `session.end`).
- ✅ **Pi**: snake_case events (`session_start`, `tool_call`, `tool_result`, `input`).
- ⚠️ **No-event-payload**: some CLIs invoke hooks with empty stdin. Handler must not crash; fallback sessionId must be synthesized from cwd.
- ⚠️ Non-zero exit code: handler returning 2 (block) must be honored — integration cancels the tool call.

---

## 4. Event Name Canonicalization

🔁 For each integration:

- ✅ Native event name (camelCase/snake_case/dotted) fed into handler becomes the canonical PascalCase name used by builtins and the dashboard.
- ⚠️ **Copilot** regression: `sessionStart` → `SessionStart`, `errorOccurred` → `Stop`. Dashboard row's `eventType` must be PascalCase after persistence.
- ⚠️ Unknown event name — handler falls through without throwing, logs a warning, returns "allow".
- ✅ `ALL_CANONICAL_EVENTS` set in handler.ts includes every mapped value from every integration's EVENT_MAP.

---

## 5. Payload Normalization

🔁 For each integration:

- ✅ `session_id` extracted from payload's native key (`sessionId`, `conversation_id`, `tab_id`, …) and assigned to normalized `session_id`.
- ✅ `tool_name` extracted from native keys (`toolName`, `tool`, `name`, `call.method`…).
- ✅ `tool_input` extracted and parsed.
- ⚠️ **Copilot** `toolArgs` that is not valid JSON falls back to raw string, not a crash.
- ⚠️ **Cursor** `conversation_id` appears inside nested `data` object — deep extract finds it.
- ⚠️ **Gemini** deep-extract for text/args/name finds values under `parts`, `arguments`, `call.method` etc. Test with realistic Gemini payload shapes.
- ⚠️ `cwd` extraction: native keys (`workspace_root`, `projectRoot`, `cwd`, `directory`) all normalize.
- ⚠️ Payloads with `null` values in expected-string fields don't become the literal string "null" in the session.

---

## 6. Integration Detection & Attribution

- ⚠️ **Priority 1**: `--integration <id>` CLI flag wins over everything else. Test: pass `--integration cursor` with a payload shaped like Copilot → attribution is cursor.
- ⚠️ **Priority 2**: `payload.integration` field (set by some CLIs' own wrappers).
- ⚠️ **Priority 3**: unique event-name fallback:
  - `BeforeTool` / `AfterTool` / `BeforeModel` → gemini
  - camelCase `COPILOT_HOOK_EVENT_TYPES.includes(eventType)` → copilot
  - snake_case `CODEX_HOOK_EVENT_TYPES.includes(eventType)` → codex
  - dotted `tool.before` → opencode
- ⚠️ **Priority 4**: payload shape `detect()` — parameterize each integration's detect function with representative payloads and negative samples from every other integration. A detect function must not false-positive on another's payload.
- ⚠️ **Default fallback**: unknown → `claude-code`. Regression-test: payload `{ hook_event_name: "sessionStart" }` with no `--integration` flag must still resolve to `copilot`, not `claude-code`.

---

## 7. Session ID Extraction & Fallback

🔁 For each integration:

- ✅ Real session ID present in payload → extracted and passed through unchanged.
- ⚠️ Empty payload + no env session vars → fallback ID is `session-<integration>-<cwd-last-segment>` (never blank, never literal `—`, never `undefined`).
- ⚠️ Env var recovery: `COPILOT_SESSION_ID`, `CURSOR_SESSION_ID`, `GEMINI_SESSION_ID` populate session when payload is empty.
- ⚠️ Same session across events emits **same** sessionId — dashboard groups them into one session row.

---

## 8. Policy Evaluation per Integration

🔁 For each integration:

- ✅ Policy fires with correct canonical event name.
- ⚠️ Policy returning `deny` results in exit code 2 and `stderr` containing the reason.
- ⚠️ Policy returning `instruct` results in exit 0 with `stdout` containing the instruction block.
- ⚠️ Stop-event policies (`require-commit-before-stop`) evaluate correctly for **non-git** cwd — they skip with a reason, not crash.
- ⚠️ Block policies (`block-sudo`, `block-rm-rf`, …) parse `tool_input.command` correctly after normalization for each integration.

---

## 9. Deduplication

- ⚠️ Same logical event fired in two scopes (project + user) produces exactly one persisted entry — the firing lock claims the event and the second process silently exits 0.
- ⚠️ Lifecycle events (SessionStart/SessionEnd/Stop) use the 5s dedup window with sessionId in the fingerprint — rapid re-runs of the same session don't double-log, but two different sessions within 5s each log.
- ⚠️ Non-lifecycle events use DEDUP_BUCKET_MS with tool_input JSON in the fingerprint — two identical Bash commands within the window log once.
- ⚠️ Dedup fingerprint **includes** `integrationType` so a Copilot SessionStart and a Claude SessionStart in the same cwd at the same instant both get logged.

---

## 10. Persistence to hook-activity Store

🔁 For each integration:

- ✅ Entry written has `integration`, `sessionId`, `eventType` (canonical), `hookEventName` (raw), `cwd`, `decision`, `timestamp`, `durationMs`.
- ⚠️ **Copilot regression**: persisted `integration` field is `"copilot"`, never undefined and never silently defaulted to `"claude-code"`.
- ⚠️ Stats file (`stats.json`) increments `totalEvents`, `denyCount`, `topPolicy`, `topPolicyCount` accurately per integration.

---

## 11. Dashboard Display Gaps

- ⚠️ SessionId `—` (em-dash) on the dashboard means the persisted entry literally lacks a sessionId. After the Copilot fix, this should never happen.
- ⚠️ Virtual project mirror: when `integration ∈ {cursor, gemini, codex, pi, opencode}`, events are mirrored into `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl` for cross-integration project views. Test each integration writes to the correct mirror.
- ⚠️ Dashboard's session detail page for a non-Claude session shows the transcript path computed by the handler (Copilot's `~/.copilot/session-state/<id>/events.jsonl`, Gemini's `~/.gemini/tmp/<project>/chats/session-...`).
- ⚠️ `cwd` trunc displays enough right-edge characters to distinguish nested projects.

---

## 12. Sync & Merge Functions

- ⚠️ **`synchronizeCopilotProjectHooks`** regression guard: call it with **no** project file present — user-scope hooks in `~/.copilot/config.json` must be preserved byte-for-byte.
- ⚠️ With a project file present, sync merges project entries without duplicating existing ones and without touching user-scope (local-binary) entries.
- ⚠️ `ensureCopilotRevisionSymlink`: on a snap install, creates `snap/copilot-cli/<rev>/.config/.../hooks` → `common/.config/.../hooks` symlink. On a non-snap install, is a no-op. Test both branches.

---

## 13. Scopes: user / project / local

🔁 For each integration that supports multiple scopes:

- ⚠️ Simultaneous install at user + project fires each hook only once (firing-lock dedup).
- ⚠️ Local scope (`.failproofai/policies-config.local.json`) overrides project scope overrides user scope for enabled-policies list.
- ⚠️ Installing at user with `FAILPROOFAI_DIST_PATH` pointing at dev dist produces hooks that reference dev dist; installing at project always uses `npx -y failproofai`.

---

## 14. Cross-Version Compatibility

- ⚠️ Hook command emitted by version N must be understood by version N's handler AND (at best-effort) by version N-1's handler. The **self-identifying event name** rule (camelCase for Copilot, snake_case for Codex) makes this work.
- ⚠️ Published npm `latest` version compatibility: install at project scope (uses `npx -y failproofai`), run the hooks, confirm the published handler still produces a dashboard-compatible entry.

---

## 15. Integration-Specific Deep Cases

### 15.1 Cursor (The IDE Native)

#### The Function Pipeline
1.  **Cursor IDE** triggers a hook from `hooks.json`.
2.  **Command**: `failproofai --hook <Event> --integration cursor --stdin`.
3.  **Payload**: JSONL object piped to stdin.
4.  **Handler**: `--integration cursor` explicitly guards identity.

#### Deep Assertions
- 🛠️ **Twin-Fire Deduplication**: Cursor fires both User and Project hooks.
    - ✅ **Assertion**: Firing lock MUST claim the first and exit-0 the second immediately. No duplicate Allow JSON should bypass a Deny from the first.
- 🛠️ **Hyper-Specific Attribution**:
    - ✅ **Assertion**: `cwd` must be lifted from `workspace_roots[0]` if top-level `cwd` is missing.
    - ✅ **Assertion**: If tool_input contains `cwd` (e.g. from terminal executing in a sub-folder), it overrides `workspace_roots`.
- 🛠️ **MCP Protocol**:
    - ✅ **Assertion**: `beforeMCPExecution` and `afterMCPExecution` correctly map to `PreToolUse` and `PostToolUse` and block unauthorized MCP tool calls.

### 15.2 Gemini CLI (Deep Data Mining)

#### The Function Pipeline
1.  **Gemini CLI** triggers a hook from `~/.gemini/settings.json`.
2.  **Command**: `failproofai --hook <Event> --integration gemini --stdin`.
3.  **Normalization**: Performs **Deep Extract Logic**.
4.  **Handler**: PascalCase Identity Guard protects native event fallback.

#### Deep Assertions
- 🛠️ **Deep Extract Logic**: Gemini nests data deeply.
    - ✅ **Assertion**: Payload `{ data: { call: { method: "ls" } } }` MUST yield `tool_name: "ls"`.
    - ✅ **Assertion**: Payload `{ parts: [{ text: "hi" }] }` MUST yield `tool_input: "hi"`.
- 🛠️ **PascalCase Identity Guard**:
    - ✅ **Assertion**: `BeforeTool` MUST BE detected as `gemini` purely by its name if no integration flag is present.
- 🛠️ **Transcript Resolution**:
    - ✅ **Assertion**: Dashboard transcript links MUST point to `~/.gemini/tmp/<project>/chats/session-<id>.json`.

### 15.3 GitHub Copilot (Sync & Snap)

#### The Function Pipeline
1.  **Copilot CLI** triggers a hook from `~/.copilot/config.json`.
2.  **Command**: `failproofai --hook <camelCaseEvent> --integration copilot`.
3.  **Normalization**: Parses stringified JSON values.

#### Deep Assertions
- 🛠️ **JSON-in-String Normalization**:
    - ✅ **Assertion**: `toolArgs` formatted as `"{\"command\":\"ls\"}"` MUST be parsed into an object.
- 🛠️ **Waterfall Metadata Extraction**:
    - ✅ **Assertion**: Copilot `tool_input` resolution MUST cleanly cascade across inconsistent keys: `toolInput` -> `toolArgs` -> `data.params` -> `message` -> `prompt`.
- 🛠️ **The Sync Engine & Snap Repair**:
    - ✅ **Assertion**: `.bashrc` MUST correctly contain `env failproofai copilot-sync 2>/dev/null` allowing snap revisions to access the `common/` hook symlinks without manual intervention.
- ⚠️ **CamelCase Stability**:
    - ✅ **Assertion**: Hook command MUST install with `preToolUse` (camelCase) to ensure older handlers correctly classify it as Copilot without flags.
- 🛠️ **Fuzzy Deep Payload Detection (Heuristic)**:
    - ✅ **Assertion**: If `--integration copilot` is missing, `detect()` must successfully identify Copilot if keys like `sessionId` or `toolName` exist inside a nested `data` object, PROVIDED the `hookName` does NOT start with PascalCase (which would conflict with Claude).
- 🛠️ **Silence Guard (Double-Dip Protection)**:
    - ✅ **Assertion**: If an event arrives marked as `--integration claude-code` (from a corrupted legacy project install) but the event type is exclusively Copilot's (e.g., `sessionStart`), the handler MUST silently abort (exit 0, no dashboard log) to prevent phantom duplicates.
- 🛠️ **Binary Detection**:
    - ✅ **Assertion**: `detectInstalled()` accurately verifies Copilot presence by checking `which gh` instead of `copilot`, reflecting its architecture as a GitHub CLI extension.

### 15.4 OpenCode (Plugin-Based)

#### The Plugin Pipeline
**OpenCode uses a TypeScript plugin injected at `.opencode/plugins/failproofai.ts`**:
```typescript
import { spawnSync } from "node:child_process";
export const FailproofAIPlugin = (ctx: any) => {
  const callcli = (event: string, args: any) => {
    const payload = { ...args, integration: "opencode", cwd: ctx.directory };
    const cmd = 'failproofai --hook ' + event + ' --integration opencode --stdin';
    const res = spawnSync(cmd, { input: JSON.stringify(payload), shell: true, encoding: "utf8" });
    if (res.status !== 0) throw new Error(res.stderr || "Blocked by FailproofAI");
  };
};
```

#### Deep Assertions
- ✅ **Synchronous Blocking**: The plugin MUST `throw Error` if `spawnSync` exits with code 2, halting the agent workflow definitively.
- ✅ **Session ID Persistence**: `session.created` must set `currentSessionId` used by all subsequent calls in the session.
- ⚠️ **Diagnostic Silence**: The wrapper must not write debug logs to stderr that could break OpenCode's JSON protocol.

### 15.5 Pi Coding Agent (Extension-Based)

#### The Extension Pipeline
**Pi uses a TypeScript extension at `.pi/extensions/failproofai.ts`**:
```typescript
export default function (pi: ExtensionAPI) {
  const callcli = (event: string, args: any, ctx?: any) => {
    const sessionId = ctx?.sessionId || pi.session?.id || "default";
    const payload = { ...args, integration: "pi", cwd: process.cwd(), session_id: sessionId };
    const res = spawnSync('failproofai --hook ' + event + ' --integration pi --stdin', {
        input: JSON.stringify(payload), shell: true, encoding: "utf8"
    });
    if (res.status !== 0) {
      ctx?.ui?.setStatus("FailproofAI: Blocked - " + (res.stderr || res.stdout));
      return { block: true };
    }
  };
}
```

#### Deep Assertions
- ✅ **Premium UI Feedback**: Verify `setStatus` is called when a policy denies an action so the user receives IDE UI feedback.
- ✅ **Recursive Isolation**: Verify the extension ignores messages starting with `/failproofai-status` to prevent infinite trigger loops.
- ✅ **Heritage Attribution**: Verify `codex_session_id` and `codex_event` keys (if present) are handled.

### 15.6 OpenAI Codex (Legacy CLI)

#### Deep Assertions
- 🛠️ **Case Stability**:
    - ✅ **Assertion**: CLI invokes with snake_case `pre_tool_use`, but `handler` maps to PascalCase `PreToolUse`. Config file keys must be PascalCase.
- 🛠️ **Trace Parsing**:
    - ✅ **Assertion**: `trace-parser.ts` MUST correctly segment multi-line Codex logs into individual `HookActivityEntry` metadata blocks.

---

## Cross-cutting: Fixture Matrix (Ultimate Payload Gallery)

For every integration, maintain a fixture directory parameterized in tests. Here are canonical assertions for parsing these core event payloads:

### 1. Cursor `beforeShellExecution` (Stdin JSON)
```json
{
  "hook_event_name": "beforeShellExecution",
  "workspace_roots": ["/home/user/project"],
  "command": "rm -rf .env",
  "integration": "cursor"
}
```
**Assertion**: `tool_name` -> `run_terminal_command`, `tool_input` -> `rm -rf .env`, `cwd` -> `/home/user/project`.

### 2. Gemini `BeforeTool` (Deep Stdin)
```json
{
  "hook_event_name": "BeforeTool",
  "data": {
    "call": {
      "method": "read_file",
      "arguments": { "path": "secrets.json" }
    }
  }
}
```
**Assertion**: `tool_name` -> `read_file`, `tool_input` -> `{ "path": "secrets.json" }`, `integration` -> `gemini`.

### 3. Copilot `preToolUse` (CLI Args + toolArgs String)
```json
{
  "hookEventName": "preToolUse",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "toolName": "bash",
  "toolArgs": "{\"command\":\"ls -la\"}"
}
```
**Assertion**: `tool_input` MUST be a parsed JSON object `{"command":"ls -la"}`, not the raw string.

### 4. OpenCode/Pi Plugin (Standard Normalized Stdin)
```json
{
  "integration": "opencode",
  "session_id": "ses_123",
  "tool_name": "edit_file",
  "tool_input": { "content": "..." },
  "cwd": "/abs/path"
}
```
**Assertion**: `integration` securely hardcoded inside the typescript wrapper, bypassing any CLI guesswork.

---

## 16. Per-Integration End-to-End Deep Coverage

Every integration is noble in itself — different install surface, different payload shape,
different transcript format, different failure modes. This section enumerates exhaustive
cases **per integration**, covering the full pipeline from CLI trigger to dashboard row.

Each subsection follows the same structure:

- **A. Install pipeline** (function chain + every branch)
- **B. Uninstall pipeline**
- **C. Settings-file shape preservation**
- **D. Hook command format** (every token of the generated bash)
- **E. Trigger reality** (what actually fires, what doesn't)
- **F. Payload ingestion**
- **G. Normalization** (every key, every fallback)
- **H. Event canonicalization round-trip**
- **I. Attribution** (without `--integration` flag)
- **J. Session ID extraction** (all keys, env recovery, fallback)
- **K. Cwd / workspace resolution**
- **L. Tool name / tool input extraction**
- **M. Policy evaluation** (block, warn, sanitize, instruct)
- **N. Decision honoring** (CLI cancels on exit 2)
- **O. Stdout/stderr contract**
- **P. Persistence fields**
- **Q. Virtual project mirror**
- **R. Transcript path resolution**
- **S. Dashboard row rendering**
- **T. Dashboard session detail page**
- **U. Scope matrix** (user / project / local)
- **V. Cross-scope duplication / dedup**
- **W. Error paths** (empty stdin, malformed JSON, permission errors)
- **X. Config-file concurrency** (two processes writing simultaneously)
- **Y. Cross-version compatibility** (old published handler sees new install)
- **Z. Known quirks specific to this integration**

---

### 16.1 Cursor — End-to-End

**CLI**: `cursor` and `cursor-agent`. Settings file: `hooks.json` (user: `~/.cursor/hooks.json`, project: `.cursor/hooks.json`, local: `.cursor/hooks.local.json`).

#### A. Install pipeline
- ✅ `manager.install("cursor", "user")` resolves path to `~/.cursor/hooks.json`.
- ✅ `manager.install("cursor", "project", cwd)` resolves to `<cwd>/.cursor/hooks.json`.
- ⚠️ If `.cursor/` directory doesn't exist, `mkdirSync(..., { recursive: true })` creates it; permission error surfaces as `CliError` not silent failure.
- ✅ `readSettings` handles a blank file (returns `{}`), a valid JSON file, and a malformed JSON file (throws a clear `CliError` with the file path).
- ✅ `writeHookEntries` iterates every event in `CURSOR_HOOK_EVENT_TYPES` and calls `buildHookEntry` per event.
- ⚠️ Existing non-failproofai entries under the same event key are preserved; ours is appended.
- ⚠️ A prior failproofai entry at that event is **replaced**, not duplicated — test re-install twice, count must remain 1 per event.
- ✅ `isFailproofaiHook(h)` matches by command substring (no marker field in Cursor's format).
- ⚠️ `postInstall` is a no-op for Cursor (unlike Copilot). Must not invoke any sync.

#### B. Uninstall pipeline
- ✅ `removeHooksFromFile` removes only entries where `isFailproofaiHook` returns true.
- ⚠️ If an event key becomes empty after removal, the key is deleted; if `hooks` object becomes empty, it is deleted; if the file becomes empty `{}`, it is still written (not deleted) to preserve explicit empty state.
- ⚠️ Uninstall on a file that never had failproofai entries returns `removed: 0` and doesn't modify the file's mtime.
- ⚠️ Uninstalling user scope must not touch project scope and vice versa.

#### C. Settings-file shape preservation
- ⚠️ Pre-existing top-level keys (not `hooks`) preserved byte-identical.
- ⚠️ Whitespace / trailing newline preserved if `writeJsonFile` uses `JSON.stringify(..., null, 2) + "\n"`. Assert EOF behavior.
- ⚠️ Nested Cursor-specific options (matcher regexes, disabled flags) inside each hook entry preserved.

#### D. Hook command format
- ✅ Command string: `"${process.execPath}" "${binaryPath}" --hook ${pascalEvent} --integration cursor --stdin`.
- ⚠️ `eventType` fed to `buildHookEntry` is Cursor's native camelCase (`beforeShellExecution` etc.); **mapped to PascalCase** for the `--hook` argument (via `CURSOR_EVENT_MAP`). This is intentional because Cursor's camelCase names overlap with Copilot's — the `--integration cursor` flag + `--stdin` are what disambiguate.
- ⚠️ `timeout: 60` field present (seconds, not ms — Cursor's schema).
- ⚠️ `--stdin` flag is mandatory; without it the handler reads nothing and mis-classifies.
- ⚠️ Windows: `process.execPath` has backslashes; bash wrapping survives Cursor's shell invocation.

#### E. Trigger reality
- ✅ Each of `beforeShellExecution`, `afterFileEdit`, `beforeReadFile`, `beforeSubmitPrompt`, `beforeMCPExecution`, `afterMCPExecution`, `stop` fires exactly one handler invocation per Cursor event.
- ⚠️ Cursor fires **both** user-scope AND project-scope hooks when both are installed — firing-lock dedup handles (see §V).
- ⚠️ Cursor Agent (headless mode) fires same events as IDE; detect distinguishes via `payload.agent_type` or absence of `editor_context`.
- ⚠️ Cursor does not fire `sessionStart` / `sessionEnd`; our `eventTypes` list reflects reality (test parity).

#### F–L. Payload ingestion & normalization
- ✅ Stdin JSONL: single line JSON, `\n` terminated.
- ⚠️ `conversation_id` appears under `data.conversation_id` AND top-level — deep extract pulls from either.
- ⚠️ `workspace_roots` is an array; `cwd` normalizes to `workspace_roots[0]` when top-level `cwd` absent.
- ⚠️ Tool input for `beforeShellExecution`: payload key is `command`, not `tool_input.command` — normalizer maps to `{ command: <string> }`.
- ⚠️ Tool input for `afterFileEdit`: `file_path` + `new_content` → `{ file_path, new_content }`.
- ⚠️ `beforeMCPExecution`: `mcp_server`, `mcp_tool`, `arguments` → `tool_name = mcp_server + ":" + mcp_tool`, `tool_input = arguments`.
- ⚠️ PascalCase canonicalization: `beforeShellExecution` → `PreToolUse` (shell is a tool), `afterFileEdit` → `PostToolUse`, `beforeSubmitPrompt` → `UserPromptSubmit`, `stop` → `Stop`.
- ⚠️ `tool_name` defaults: if unknown after normalization, derived from `command` first token (`/usr/bin/ls` → `ls`).

#### M–O. Policy evaluation & decision honoring
- ⚠️ `block-sudo` on `beforeShellExecution(command: "sudo apt install foo")` → exit 2, stderr contains policy reason; Cursor cancels the exec.
- ⚠️ `warn-repeated-tool-calls` fires with Cursor-specific threshold (Cursor agents are chattier than Claude — policy must detect `session.integration === "cursor"` and raise threshold accordingly).
- ⚠️ `sanitize-api-keys` on `afterFileEdit(new_content: "KEY=sk-...")` → deny; Cursor reverts the edit (assert via Cursor's own transcript).
- ⚠️ Stop-event policies (`require-commit-before-stop` etc.) fire on Cursor's `stop` event; must handle Cursor's lack of `transcript_path`.
- ⚠️ Instruct decision (exit 0 with stdout JSON) is consumed by Cursor's system-prompt injector — assert stdout shape matches Cursor's `{ "systemMessage": "..." }` schema.

#### P–R. Persistence / transcript
- ✅ Persisted entry has `integration: "cursor"`, canonical PascalCase `eventType`, raw `hookEventName` (camelCase), `sessionId`, `cwd`, `policyName`.
- ⚠️ Virtual project mirror: entry mirrored into `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl` (Cursor ∈ VIRTUAL_PROJECT_LOG_INTEGRATIONS).
- ⚠️ Transcript path: Cursor doesn't expose one directly; handler sets `transcriptPath: undefined`. Dashboard detail page handles gracefully (no broken link).

#### S–T. Dashboard
- ⚠️ Integration badge renders `Cursor` in blue.
- ⚠️ Session detail page lists all events grouped by `sessionId`; if `sessionId` is the synthesized `session-cursor-<dir>` (no real UUID), still groups events logically.
- ⚠️ `eventType` column shows `PreToolUse` not `beforeShellExecution` — canonicalization must reach persistence.
- ⚠️ Filter `?integration=cursor` returns only cursor rows; combined with `?decision=deny` narrows further.

#### U–V. Scope matrix
- ⚠️ User scope: `~/.cursor/hooks.json`. Project: `.cursor/hooks.json`. Local: `.cursor/hooks.local.json` (if supported).
- ⚠️ Twin-fire: both user + project install → Cursor fires both → firing lock picks first, second exits 0 cleanly (no duplicate allow/deny).
- ⚠️ Ordering: project-scope entries evaluated before user-scope (precedence).

#### W. Error paths
- ⚠️ Empty stdin (Cursor pipes nothing): handler logs warning "stdin is empty for <event> - Cursor Agent might not be piping context", still synthesizes session, returns allow.
- ⚠️ Malformed JSON stdin: handler logs "payload parse failed", treats as empty payload, returns allow.
- ⚠️ `~/.cursor/hooks.json` permission denied: install surfaces clear error, doesn't write partial file.

#### X. Concurrency
- ⚠️ Two Cursor windows firing simultaneously: writes to `current.jsonl` serialized by advisory lock, no JSONL corruption.

#### Y. Cross-version
- ⚠️ Old published handler receiving `--hook PreToolUse --integration cursor --stdin` + Cursor-shaped payload: attributes correctly via `--integration` flag even if event-name lookup fails.

#### Z. Known quirks
- ⚠️ Cursor IDE v0.42+ changed payload shape — regression guard for any hard-coded path keys.
- ⚠️ Cursor Agent emits `beforeSubmitPrompt` with an empty `prompt` field during init — sanitize policies must not flag empty strings.
- ⚠️ Cursor's built-in rules file coexists with our hooks — test that our `stop` policy output doesn't conflict with Cursor's own stop-behavior.

---

### 16.2 Gemini CLI — End-to-End

**CLI**: `gemini`. Settings file: `~/.gemini/settings.json` (user), `.gemini/settings.json` (project). Gemini uses Claude's settings format (`hooks: { EventName: [{ hooks: [...] }] }`).

#### A. Install pipeline
- ✅ `getSettingsPath("user")` → `~/.gemini/settings.json`.
- ✅ `getSettingsPath("project", cwd)` → `<cwd>/.gemini/settings.json`.
- ⚠️ Shared Claude-format settings: `writeHookEntries` inserts matchers under `s.hooks[eventType]`; must not disturb other Gemini-specific top-level keys (`theme`, `models`, `mcpServers`).
- ⚠️ `FAILPROOFAI_HOOK_MARKER` field added to each entry — `isFailproofaiHook` matches on marker AND command substring (belt + suspenders).

#### B. Uninstall pipeline
- ⚠️ Removes entries whose marker is true OR command contains `failproofai`. Empty matcher arrays collapsed.
- ⚠️ Must not remove user's own custom Gemini hooks that happen to share an event type.

#### C. Settings-file shape preservation
- ⚠️ Preserves `theme`, `mcpServers`, `approvalMode`, `telemetry`, `selectedAuthType`, `model` blocks.
- ⚠️ `hooks` block ordering preserved where possible (Gemini sometimes reads events in order).

#### D. Hook command format
- ✅ Command: `"${process.execPath}" "${binaryPath}" --hook ${eventType} --integration gemini --stdin` (user) OR `npx -y failproofai --hook ${eventType} --integration gemini --stdin` (project).
- ⚠️ Event name preserved as Gemini's **unique PascalCase** (`BeforeTool`, `BeforeModel`, etc.) — these names don't overlap with Claude's PascalCase (`PreToolUse`), so attribution works via event-name fallback even without `--integration`.
- ⚠️ `--stdin` flag mandatory.

#### E. Trigger reality
- ✅ `BeforeTool`, `AfterTool`, `BeforeModel`, `AfterModel`, `BeforeAgent`, `AfterAgent`, `BeforeToolSelection`, `PreCompress`, `Notification`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `Stop` (test every event Gemini actually fires).
- ⚠️ Gemini fires `PreCompress` before truncating context — unique to Gemini; policy has access to `parts` count and can instruct or allow.
- ⚠️ `BeforeToolSelection` fires BEFORE `BeforeTool` — handler must not dedup them together (different canonical events? Currently both map to PreToolUse? **DECIDE AND TEST**).

#### F–L. Payload & normalization
- ⚠️ Gemini nests **everything** under `data` — deep-extract pulls: `data.call.method` → `tool_name`, `data.call.arguments` → `tool_input`, `data.parts[].text` → prompt text.
- ⚠️ `data.session.id` vs top-level `sessionId` vs `data.sessionID` — normalizer tries all.
- ⚠️ `data.workspace.root_path` → `cwd` fallback.
- ⚠️ `data.model.name` → part of tool_name for `BeforeModel` event.
- ⚠️ Gemini's `parts` array may contain mixed text + functionCall entries — normalizer extracts text for UserPromptSubmit, functionCall.name for BeforeTool.
- ⚠️ Arguments may be a JSON object OR a JSON-encoded string — handle both.
- ⚠️ `transcript_path`: Gemini emits `data.transcript_path`; fallback to constructed `~/.gemini/tmp/<project-hash>/chats/session-<timestamp>-<short-id>.json`.

#### M–O. Policy evaluation
- ⚠️ `block-sudo` on `BeforeTool(tool_name=run_shell_command, tool_input.command="sudo ...")` → deny; Gemini cancels.
- ⚠️ `sanitize-api-keys` on `AfterTool` output scans `data.result` / `data.output` text.
- ⚠️ `warn-repeated-tool-calls` threshold tuned for Gemini (tends to retry on model errors).
- ⚠️ Stop-event policies fire on `Stop`; Gemini's Stop has a `reason` field (user-cancel vs model-done) — policy differentiates.
- ⚠️ `PreCompress` policy: custom hook can log size + decide allow/deny (default allow).

#### P–R. Persistence / transcript
- ✅ `integration: "gemini"`, PascalCase canonical event, sessionId = real Gemini session UUID.
- ⚠️ Virtual project mirror: Gemini writes to `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl` (Gemini ∈ VIRTUAL_PROJECT_LOG_INTEGRATIONS).
- ⚠️ Transcript: `~/.gemini/tmp/<project-hash>/chats/session-<YYYY-MM-DD>T<HH-MM>-<shortId>.json`. Dashboard link must resolve to existing file.
- ⚠️ Gemini session UUID vs Gemini's internal "chat id" — test both keys map to same session row.

#### S–T. Dashboard
- ⚠️ Badge: `Gemini` in indigo.
- ⚠️ Session detail page parses Gemini's chat JSON (different shape than Claude's JSONL transcript) — log-entries parser has a Gemini branch. Test with real fixture.
- ⚠️ `BeforeTool` / `AfterTool` shown as PascalCase `PreToolUse` / `PostToolUse`; `BeforeModel` / `AfterModel` shown as... **DECIDE canonical mapping and test.**

#### U–V. Scope matrix
- ⚠️ User: `~/.gemini/settings.json`. Project: `.gemini/settings.json`.
- ⚠️ No Cursor-style twin-fire; dedup still applies for safety.

#### W. Error paths
- ⚠️ Empty `data` block: handler doesn't crash on deep-extract; falls back to integration="gemini" + sessionId fallback.
- ⚠️ Gemini CLI invokes hook with non-JSON stdin during auth flow — handler treats as empty, returns allow.

#### X. Concurrency
- ⚠️ Gemini CLI runs tools sequentially, but notifications + Before/AfterModel may overlap — advisory lock required.

#### Y. Cross-version
- ⚠️ `BeforeTool` / `AfterTool` etc. are Gemini-unique; event-name fallback attributes correctly on any handler version that lists them in GEMINI_UNIQUE or GEMINI_HOOK_EVENT_TYPES.

#### Z. Known quirks
- ⚠️ Gemini re-fires `BeforeTool` on retry — `warn-repeated-tool-calls` must not count these as user-initiated repeats.
- ⚠️ Gemini's `Notification` event is transient; dashboard must not surface every one as a major row (consider collapsing).
- ⚠️ Gemini on Windows uses a different tmp path (`%LOCALAPPDATA%\Google\Gemini\tmp\...`); transcript resolution branches.

---

### 16.3 OpenAI Codex — End-to-End

**CLI**: `codex`. Settings file: user `~/.codex/hooks.json`, project `.codex/hooks.json`. Codex uses Claude-like format but keys are PascalCase in config while commands are invoked with snake_case event args.

#### A. Install pipeline
- ✅ Paths resolve correctly for user and project.
- ⚠️ `writeHookEntries` writes entries under PascalCase keys (`PreToolUse`), but the `--hook` argument in the bash command is snake_case (`pre_tool_use`). Test both simultaneously.
- ⚠️ Existing Codex-specific settings (`modelProvider`, `approvalPolicy`, `sandboxPolicy`) preserved.

#### B. Uninstall pipeline
- ✅ Removes matchers whose `hooks[].command` contains `failproofai` or whose marker is true.
- ⚠️ Empty PascalCase event keys deleted after removal.

#### D. Hook command format
- ✅ `"${process.execPath}" "${binaryPath}" --hook ${snakeEvent} --integration codex` (user) / `npx -y failproofai --hook ${snakeEvent} --integration codex` (project).
- ⚠️ Snake_case event name in command = unique Codex signal (distinct from Claude PascalCase, Copilot camelCase, Gemini unique PascalCase, Cursor camelCase, OpenCode dotted). Attribution self-identifies without `--integration`.
- ⚠️ No `--stdin` (Codex uses env vars for some payload keys).

#### E. Trigger reality
- ✅ `pre_tool_use`, `post_tool_use`, `session_start`, `session_end`, `user_prompt_submitted`, `agent_stop`, `notification` — every one fires once per Codex event.
- ⚠️ Codex supports approval-based tool gating; hook firing order relative to Codex's built-in approval dialog must not deadlock.

#### F–L. Payload & normalization
- ⚠️ Codex emits snake_case keys (`session_id`, `tool_name`, `tool_input`) natively — normalization is light.
- ⚠️ `tool_input` is already a JSON object; no stringified parsing needed.
- ⚠️ `transcript_path` absent; derived from `CODEX_TRACE_DIR` env var + session ID.
- ⚠️ `cwd` from `workspace_root` or `process.cwd()`.

#### H. Canonicalization
- ⚠️ `pre_tool_use` → `PreToolUse`, `session_start` → `SessionStart`, etc. `CODEX_EVENT_MAP` is the source of truth — round-trip fuzz test.

#### M–O. Policy evaluation
- ⚠️ `block-sudo`, `block-rm-rf`, `block-curl-pipe-sh` all apply on `pre_tool_use`; deny → exit 2 → Codex cancels.
- ⚠️ Codex's sandbox policy may already block some commands; our hook layer must not false-report deny when Codex itself also denied (avoid duplicate logs).
- ⚠️ Stop-event policies on `agent_stop`: test non-git, detached-HEAD, and fully-green cases.

#### P–R. Persistence / transcript
- ✅ `integration: "codex"`, canonical PascalCase event name, real session UUID.
- ⚠️ Virtual project mirror: Codex ∈ VIRTUAL_PROJECT_LOG_INTEGRATIONS — writes to `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl`.
- ⚠️ Codex trace log: `~/.codex/traces/<sessionId>.log` — parsed by `src/codex/trace-parser.ts`. Unit-test parser with real log samples: extracts `tool_calls`, handles truncation, multi-line entries, UTF-8 edge cases.

#### S–T. Dashboard
- ⚠️ Badge: `Codex` in purple.
- ⚠️ Trace parser output displayed alongside hook entries on session detail page; order preserved by timestamp.

#### U–V. Scope matrix
- ⚠️ User vs project: same rules as Cursor/Gemini.

#### W. Error paths
- ⚠️ Codex trace file missing: dashboard session page shows hooks-only history, no crash.
- ⚠️ Codex killed mid-tool: `post_tool_use` never fires; Stop policies still evaluate on next `agent_stop`.

#### Y. Cross-version
- ⚠️ `pre_tool_use` snake_case is Codex-unique; old handler still attributes via event-name fallback.

#### Z. Known quirks
- ⚠️ Codex `notification` event is fire-and-forget — don't dedup it against other events.
- ⚠️ Codex may spawn sub-agents; `agent_stop` fires for each. Session grouping must handle parent + children.

---

### 16.4 OpenCode — End-to-End

**Runtime**: `.opencode/plugins/failproofai.ts` (TypeScript plugin loaded by OpenCode at runtime). No static settings file — plugin code is the install artifact.

#### A. Install pipeline
- ✅ `manager.install("opencode", "project")` writes `.opencode/plugins/failproofai.ts` with the generated plugin source.
- ✅ `manager.install("opencode", "user")` writes `~/.opencode/plugins/failproofai.ts`.
- ⚠️ Plugin source embeds `failproofai --hook <event> --integration opencode --stdin` shell command or invokes `cli.mjs` directly (choose one path and test consistently).
- ⚠️ Plugin relies on `FAILPROOFAI_DIST_PATH` or `npx -y failproofai` — matrix-test both modes.
- ⚠️ Existing user-authored plugins in same directory preserved.

#### B. Uninstall pipeline
- ⚠️ `removeHooksFromFile` deletes the plugin file entirely (since each plugin is one file). Must not delete unrelated plugins.

#### C. Plugin source shape
- ⚠️ Plugin exports `FailproofAIPlugin` (named export) with signature OpenCode expects.
- ⚠️ Plugin captures `ctx.directory` for cwd; `ctx.session?.id` for session.
- ⚠️ Plugin uses `spawnSync` (synchronous — OpenCode requires sync blocking to halt tool calls).

#### D. Invocation surface
- ✅ Plugin's `callcli(event, args)` builds payload `{ ...args, integration: "opencode", cwd: ctx.directory }` and pipes JSON stdin.
- ⚠️ `--integration opencode` passed explicitly — no event-name fallback needed.
- ⚠️ Dotted event names (`tool.before`, `tool.after`, `session.start`, `session.end`) preserved verbatim in payload `hook_event_name`.

#### E. Trigger reality
- ✅ `session.created`, `session.destroyed`, `tool.before`, `tool.after`, `prompt.submit`, `agent.stop` — each fires exactly once.
- ⚠️ OpenCode fires hooks synchronously during tool dispatch — blocking longer than 10s kills the tool call.

#### F–L. Payload & normalization
- ⚠️ OpenCode plugin pre-normalizes keys (`integration`, `session_id`, `tool_name`, `tool_input`, `cwd`) before spawning. Handler has almost nothing to do.
- ⚠️ If plugin ctx is missing session (rare init case), plugin sends `session_id: "default"`; handler synthesizes `session-opencode-default`.
- ⚠️ `tool_input` is always an object (plugin pre-serializes).

#### H. Canonicalization
- ⚠️ `tool.before` → `PreToolUse`, `tool.after` → `PostToolUse`, `session.created` → `SessionStart`, etc. `OPENCODE_EVENT_MAP` source of truth.

#### M–O. Policy evaluation & decision
- ⚠️ Deny → `throw new Error(stderr)` in plugin → OpenCode treats as tool failure, cancels call.
- ⚠️ Instruct → plugin reads stdout, injects into agent context (OpenCode's system-prompt addendum mechanism).
- ⚠️ Timeout in `spawnSync` → plugin treats as allow (fail-open) to avoid freezing the agent.

#### P–R. Persistence
- ✅ `integration: "opencode"`, canonical event names, real session UUID.
- ⚠️ Virtual project mirror: OpenCode ∈ VIRTUAL_PROJECT_LOG_INTEGRATIONS.
- ⚠️ Transcript: OpenCode has no file transcript; dashboard session page uses hook events as the timeline.

#### S–T. Dashboard
- ⚠️ Badge: `OpenCode` in amber.
- ⚠️ Session detail renders from hook events only (no external transcript file to cross-reference).

#### U–V. Scope matrix
- ⚠️ User-scope plugin: `~/.opencode/plugins/failproofai.ts`. Project: `.opencode/plugins/failproofai.ts`. Local: N/A (OpenCode has no .local convention).
- ⚠️ If both scopes install, OpenCode loads both — plugin imports dedup via file-content hash; firing-lock handles runtime dedup.

#### W. Error paths
- ⚠️ `spawnSync` fails to find `failproofai` binary: plugin logs warning to OpenCode debug channel, returns allow (fail-open) so OpenCode keeps working.
- ⚠️ JSON stringify failure on circular payload: plugin catches, sends `{}`, handler falls back.
- ⚠️ **Diagnostic stderr suppression**: handler must NOT write debug logs to stderr during normal success — OpenCode parses stderr strictly. Regression guard: test that handler's stderr is empty on allow.

#### X. Concurrency
- ⚠️ OpenCode fires tool.before / tool.after on different tools concurrently (parallel tool calls) — advisory lock serializes persistence writes.

#### Y. Cross-version
- ⚠️ Plugin is version-controlled with our package; `--integration opencode` flag is explicit — cross-version works as long as handler accepts the flag.

#### Z. Known quirks
- ⚠️ OpenCode's `session.created` fires BEFORE `ctx.session.id` is populated in some versions — plugin must handle missing session ID.
- ⚠️ OpenCode's tool arg format varies by tool; plugin sends raw `args` object and relies on handler's policy code to interpret.
- ⚠️ Plugin throws `new Error("Blocked by FailproofAI")` — OpenCode renders as a red failure; test exact message.

---

### 16.5 Pi Coding Agent — End-to-End

**Runtime**: `.pi/extensions/failproofai.ts` (TypeScript extension). Like OpenCode, code IS the install artifact.

#### A. Install pipeline
- ✅ Writes `~/.pi/extensions/failproofai.ts` (user) or `.pi/extensions/failproofai.ts` (project).
- ⚠️ Extension source imports Pi's `ExtensionAPI` type (loosely — no hard type dep).
- ⚠️ Extension uses `spawnSync` identical to OpenCode for synchronous blocking.

#### B. Uninstall pipeline
- ⚠️ Deletes extension file; no other cleanup.

#### C. Extension source shape
- ⚠️ Default export is a function `(pi: ExtensionAPI) => void`.
- ⚠️ Registers event handlers for each Pi event via `pi.on("session_start", ...)` etc.
- ⚠️ UUID resolution: Pi's session key may be non-UUID (e.g. path-like); extension converts to stable UUID via hash.

#### D. Invocation surface
- ✅ Command: `failproofai --hook <event> --integration pi --stdin`.
- ⚠️ Event name snake_case (`session_start`, `tool_call`, `tool_result`, `input`) — unique-ish but overlaps with Codex's snake_case. Therefore `--integration pi` flag is mandatory for correct attribution.

#### E. Trigger reality
- ✅ `session_start`, `session_end`, `tool_call`, `tool_result`, `input`, `error` — each fires.
- ⚠️ Pi's `input` = user prompt; maps to canonical `UserPromptSubmit`.
- ⚠️ Pi's `tool_call` maps to `PreToolUse`, `tool_result` to `PostToolUse`.
- ⚠️ Pi has no native Stop event; `session_end` serves that role.

#### F–L. Payload & normalization
- ⚠️ `ctx.sessionId` populates `payload.session_id` on every event.
- ⚠️ `tool_call` payload: `{ name, arguments }` → `tool_name`, `tool_input`.
- ⚠️ `tool_result` payload: `{ name, result, error }` — policy decision depends on success/failure.
- ⚠️ Pi's `directory` vs `cwd` vs `workspace_root`: normalizer tries all, prefers most specific.
- ⚠️ Special key `codex_session_id` / `codex_event` (heritage from Pi-over-Codex) — handled if present.

#### H. Canonicalization
- ⚠️ `session_start` → `SessionStart`. Note collision with Codex's `session_start`. Handler disambiguates by `--integration pi` flag only. Regression guard: Pi payload without `--integration` defaults to Codex → WRONG; add explicit Pi detect via presence of `pi_version` or similar payload key.

#### M–O. Policy evaluation & decision
- ⚠️ Deny: extension returns `{ block: true }` AND calls `ctx.ui.setStatus("FailproofAI: Blocked - <reason>")` for premium UI feedback.
- ⚠️ Instruct: extension injects stdout into Pi's agent context via `ctx.agent.addSystemMessage`.
- ⚠️ Recursive isolation: extension detects if payload content starts with `/failproofai-status` and short-circuits (allow, no log) to prevent infinite loops from its own status messages.

#### P–R. Persistence
- ✅ `integration: "pi"`, canonical event names, UUID session.
- ⚠️ Virtual project mirror: Pi ∈ VIRTUAL_PROJECT_LOG_INTEGRATIONS.
- ⚠️ Pi's transcript/log path: `~/.pi/sessions/<sessionId>/transcript.jsonl` (or similar). Dashboard parses if present.

#### S–T. Dashboard
- ⚠️ Badge: `Pi` in rose.
- ⚠️ Session detail surfaces Pi-specific status messages (from `setStatus` calls) alongside policy decisions.

#### U–V. Scope matrix
- ⚠️ User: `~/.pi/extensions/failproofai.ts`. Project: `.pi/extensions/failproofai.ts`. Local: N/A.
- ⚠️ Both-scope install: Pi loads both; dedup via content hash + firing-lock.

#### W. Error paths
- ⚠️ `spawnSync` times out (>10s): extension treats as allow, logs warning via `ctx.ui.setStatus`.
- ⚠️ Extension exception: caught, logged, allow-through so Pi session doesn't crash.
- ⚠️ **Diagnostic stderr suppression** (same as OpenCode): handler stderr empty on allow.

#### X. Concurrency
- ⚠️ Pi may dispatch parallel tool calls in agent-mode; advisory lock serializes persistence.

#### Y. Cross-version
- ⚠️ `--integration pi` flag mandatory; without it on old handler, payload falls back to Codex (collision). Publish only when handler recognizes Pi via payload signature too.

#### Z. Known quirks
- ⚠️ Pi's `ctx.session?.id` may be undefined for the very first event after launch; extension handles gracefully.
- ⚠️ Pi premium features: `setStatus` is only available in paid tier; extension must no-op if `ctx.ui` undefined.
- ⚠️ Pi emits `error` events for non-fatal issues; policy should not treat every error as a Stop.

---

## 17. Transcript Parser Edge Cases (per integration)

Each integration's transcript parser (`lib/log-entries.ts` or `src/codex/trace-parser.ts`) has its own format. Parameterize these tests per integration:

- ✅ Valid transcript: every line parses, timeline order preserved.
- ⚠️ Partial-line at EOF (file still being written): parser handles without throwing.
- ⚠️ UTF-8 BOM at start: stripped.
- ⚠️ Non-UTF-8 bytes in the middle: parser substitutes replacement chars, keeps going.
- ⚠️ Empty file: returns `[]`.
- ⚠️ File larger than memory limit: parser streams, doesn't load all into RAM.
- ⚠️ Nested tool calls: parent/child tool relationships preserved in output order.
- ⚠️ System messages interleaved with user/assistant: correctly typed in output.
- ⚠️ Integration-specific fields (Gemini's `parts`, Codex's trace markers, Cursor's MCP blocks): extractor pulls them into dashboard-visible metadata.

---

## 18. Dashboard Display Gap — Deep Catalog (per integration)

Gaps that appear in the dashboard when the persistence layer lacks data. For each integration confirm the rendering falls back sensibly:

- ⚠️ Missing `sessionId`: show fallback `session-<integration>-<dir>`, NEVER empty `—`.
- ⚠️ Missing `transcriptPath`: session detail page renders from hook events only; "View transcript" button hidden instead of linking to 404.
- ⚠️ Missing `cwd`: row shows `—`; project filter doesn't crash.
- ⚠️ Missing `toolName`: derived from command or "(none)"; column never empty.
- ⚠️ Missing `policyName` but `policyNames` present: render first + "+N" count.
- ⚠️ Missing both `policyName` and `policyNames` on allow: "—" is correct.
- ⚠️ Missing `reason` on deny/instruct: stderr snippet shown instead of blank.
- ⚠️ Integration field = legacy value not in `INTEGRATION_STYLES`: badge shows raw string with default gray styling, not crash.
- ⚠️ Very long `reason` (>2kb): truncated with "…" + expandable click.
- ⚠️ Policy reason with embedded newlines: rendered as multi-line block, not `\\n` literal.
- ⚠️ Duration spike (>10s): highlighted to flag policy performance regression.

---

## 19. Manager & CLI Surface (per integration)

- ⚠️ `failproofai policies` (list) — shows per-integration status for each scope.
- ⚠️ `failproofai policies --install <name> --integration <id>` — enables only that policy.
- ⚠️ `failproofai policies --install all --integration <id>` — enables all.
- ⚠️ `failproofai policies --uninstall <name> --integration <id>` — disables only that policy.
- ⚠️ `failproofai policies --uninstall all --integration <id>` — removes all hooks.
- ⚠️ `--scope user | project | local` — routing to correct file.
- ⚠️ `--cwd <path>` override for project-scope operations.
- ⚠️ `--strict` flag for custom hook loading: error instead of fail-open on syntax errors.
- ⚠️ `--dry-run` (if supported): prints what would change without writing.
- ⚠️ `failproofai p -i -c <custom-policy-file>` — inline test a custom policy against each integration's payload shape.
- ⚠️ `failproofai --version` — matches package.json; regression guard for version-consistency CI check.
- ⚠️ `failproofai copilot-sync` — works silently on non-snap systems; idempotent.

---

## 20. Custom Hooks & Convention Policies (per integration)

- ⚠️ `failproofai.config.js` / `.failproofai-project.js` / `.failproofai-user.js` discovered in correct order.
- ⚠️ Custom hook `match.events` filtering works with each integration's canonical event names.
- ⚠️ Custom hook receiving `ctx.session.integration` can branch per integration.
- ⚠️ Custom hook timeout (10s) kills long-running user code without crashing handler.
- ⚠️ Custom hook exception caught, logged, treated as allow (fail-open unless `--strict`).
- ⚠️ Convention policies (`.failproofai-<scope>` dir) loaded with correct scope tag.
- ⚠️ Custom hook returning `deny` with reason shows up in persistence with `policyName: "custom/<name>"`.
- ⚠️ Transitive imports from custom hook: `loader-utils.ts` rewrites `from 'failproofai'` to local dist path.

---

## 21. Release & Publishing Safety

- ⚠️ Version bump only updates root `package.json` (CI version-consistency check).
- ⚠️ CHANGELOG.md has entry under `## Unreleased`.
- ⚠️ Docker clean-install smoke test passes from packed tarball (not local source).
- ⚠️ `npm pack --ignore-scripts` produces a tarball that installs cleanly.
- ⚠️ After publishing, `npx -y failproofai@<new-version>` used by project-scope hooks works end-to-end on a fresh machine for each integration.
- ⚠️ E2E test suite runs a smoke flow for each integration (install → fire event → check persistence).

---

## Known Past Regressions (Must maintain named tests)

| # | Regression                                                            | Test name                                            |
|---|-----------------------------------------------------------------------|------------------------------------------------------|
| 1 | Codex SessionStart mis-attributed to Gemini                            | `handler > --integration flag wins over event-name` |
| 2 | Lifecycle events swallowed by 60s dedup window                         | `dedup > lifecycle uses 5s window + sessionId`      |
| 3 | Copilot events labeled as Claude on dashboard                          | `copilot > native camelCase event names install`    |
| 4 | Copilot session ID shows as `—`                                        | `copilot > fallback sessionId synthesized`          |
| 5 | `synchronizeCopilotProjectHooks` wipes user-scope entries              | `copilot-sync > preserves user scope when no project file` |
| 6 | Copilot `toolArgs` stringified JSON caused tool_input to be a string   | `copilot > normalize parses toolArgs JSON`          |
| 7 | `npx -y failproofai` (published 0.0.5) ignored `--integration` flag    | `cross-version > event-name fallback attributes correctly on old handler` |
| 8 | Cursor integration policy bypass on non-Claude agents                  | `policy > warn-repeated-tool-calls tunes for non-Claude` |
| 9 | Diagnostic stderr leak broke OpenCode/Pi JSON protocol                 | `opencode/pi > handler silent on success`           |
| 10 | `.failproofai-<scope>` convention hooks not loading                    | `custom-hooks > convention files loaded per scope`  |

---

**Usage:** Treat this document as the absolute architectural source of truth and acceptance checklist for any PR touching `src/hooks/`, `src/codex/`, or any integration file. A PR that modifies behavior in one of the categories above must either add/update a test covering its rows or explicitly justify in the PR description why no test was added.
