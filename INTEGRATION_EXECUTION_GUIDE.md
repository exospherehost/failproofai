# Integration Execution Guide

> Snapshot for branch `feat/cursor-integration`.
>
> This guide is grounded in the current source and test surface in this branch, not in wishful architecture.
>
> Refresh this file whenever integration source, integration tests, or integration fixtures materially change.
>
> Primary truth sources for this document:
> `src/hooks/types.ts`, `src/hooks/integrations.ts`, `src/hooks/handler.ts`,
> `__tests__/hooks/integrations.test.ts`, `__tests__/hooks/handler.test.ts`,
> `__tests__/e2e/helpers/payloads.ts`,
> `__tests__/e2e/hooks/*.test.ts`,
> `__tests__/INTEGRATION_TEST_CASES.md`.

---

## 1. Purpose And How To Use This Guide

**Simple View**

This file is the main playbook for non-Claude integrations in this repo:
Cursor, Gemini, GitHub Copilot, Codex, OpenCode, and Pi.

Use it when you need to answer four questions:

1. What already exists in this branch?
2. What is still missing?
3. Which regressions matter most?
4. What tests should be written next?

If you are new to the repo, read this file top to bottom once.
If you are doing implementation work, jump in this order:

1. Current Branch Truth Snapshot
2. Cross-Integration Pending Matrix
3. The playbook for your integration
4. How To Convert A Pending Row Into Tests

**Expert View**

This file is not a replacement for `__tests__/INTEGRATION_TEST_CASES.md`.

Use this guide for:

- current branch truth
- prioritization
- gap tracking
- next-test planning
- regression awareness

Use `__tests__/INTEGRATION_TEST_CASES.md` for:

- the deeper edge-case contract
- long-form assertions
- named regression references
- exhaustive future test ideas

If this guide and the source code disagree, trust the source code first and update this guide second.

### Important Words In Simple Language

| Term | Meaning |
|---|---|
| Integration | One external agent or tool that failproofai connects to, such as Cursor or Copilot |
| Native event name | The exact event name used by that tool, such as `preToolUse` or `pre_tool_use` |
| Canonical event name | The shared internal failproofai event name, such as `PreToolUse` |
| Payload | The JSON data sent into the hook handler |
| Normalize | Convert different payload styles into one common internal shape |
| Regression test | A test for a bug that already happened once and must not return |
| Gap table | A truth table that says what is implemented, what is tested, and what is still missing |

### Where To Look In This Repo

| File Or Area | Why It Matters |
|---|---|
| `src/hooks/types.ts` | integration ids, native event lists, native-to-canonical maps |
| `src/hooks/integrations.ts` | install, uninstall, detect, normalize, command generation, helper logic |
| `src/hooks/handler.ts` | stdin parsing, attribution, session extraction, persistence, transcript logic |
| `src/hooks/manager.ts` | CLI install and uninstall flow |
| `__tests__/hooks/integrations.test.ts` | unit tests for per-integration object behavior |
| `__tests__/hooks/handler.test.ts` | unit tests for runtime and handler behavior |
| `__tests__/e2e/helpers/payloads.ts` | reusable event payload builders |
| `__tests__/e2e/hooks/*.test.ts` | true end-to-end integration flows |
| `__tests__/INTEGRATION_TEST_CASES.md` | deeper contract and regression checklist |
| `AGENTS.md` | repo rules for testing, Docker smoke tests, CI, and branch hygiene |

---

## 2. What “Done” Means For Any Integration

**Simple View**

An integration is not done just because one event appears in the dashboard.

An integration is done only when all of these are true:

- install works
- uninstall works
- reinstall does not duplicate hooks
- native events fire correctly
- event names map to the right canonical names
- payload data is normalized correctly
- session id is extracted correctly
- dashboard shows the right integration and the right session
- policies still allow, deny, or instruct correctly
- important regressions have named tests
- the relevant tests pass

**Expert View**

Minimum done-bar for any integration:

- source registration exists in `types.ts` and `integrations.ts`
- install and uninstall behavior is covered
- integration identity is reliable with and without `--integration`
- session id fallback is safe
- persistence fields are correct
- one broken branch does not silently relabel data as another integration
- regression-prone behavior has dedicated tests, not only incidental coverage

Things that are not enough:

- “events show in dashboard”
- “manual testing looked okay once”
- “unit section exists”
- “one e2e test passes”

Done means stable, attributable, test-backed behavior.

### One Big Rule

Do one integration fully before moving to the next one.

Bad pattern:

- Gemini half done
- Cursor half done
- Copilot half done
- Codex half done

Good pattern:

1. Pick one integration
2. Make it stable
3. Add regression tests
4. Only then move to the next one

This is the fastest safe way to work on this repo.

---

## 3. Current Branch Truth Snapshot

**Simple View**

This branch already has real implementations for all 6 non-Claude integrations.
The problem is not “nothing exists.”
The problem is that the code is ahead of the tests.

Today:

- Cursor, Gemini, and Copilot have the strongest test surface
- Codex and OpenCode have unit coverage but no dedicated e2e file
- Pi has source code, but the weakest visible test surface
- handler-level integration coverage is shallow across the branch

**Expert View**

Status meanings used below:

- `Yes`: a dedicated surface exists
- `Shallow`: only light or indirect coverage exists
- `No`: no dedicated surface was found

| Integration | Source Implemented | Unit Coverage | Handler Coverage | E2E Coverage | Payload Fixtures | Highest-Risk Pending Area |
|---|---|---|---|---|---|---|
| Cursor | Yes | Yes | Shallow | Yes | Yes | Twin-fire dedup, cwd/workspace attribution, MCP deep cases |
| Gemini | Yes | Yes | Shallow | Yes | Yes | Deep extraction, attribution without flag, transcript and dashboard deep cases |
| Copilot | Yes | Yes | Shallow | Yes | Yes | `toolArgs` parsing, sync/snap branches, session-id and dashboard regressions, silence guard |
| Codex | Yes | Yes | Shallow | No dedicated file | No dedicated section | Snake_case identity, handler mapping, trace-related behavior |
| OpenCode | Yes | Yes | Shallow | No dedicated file | No dedicated section | Plugin blocking, stderr silence, session persistence |
| Pi | Yes | No dedicated section found | Shallow | No dedicated file | No dedicated section | Extension session handling, UI feedback, recursive isolation |

Global handler note:
`__tests__/hooks/handler.test.ts` currently does not provide deep, integration-specific coverage across these six integrations.
Treat handler behavior as an active gap area unless a dedicated assertion is clearly present.

Current file-evidence summary:

- Dedicated e2e files exist today for `cursor`, `gemini`, and `copilot`
- Dedicated payload helper sections exist today for `CursorPayloads`, `GeminiPayloads`, and `CopilotPayloads`
- Dedicated `integrations.test.ts` sections exist today for `cursor`, `gemini`, `copilot`, `codex`, and `opencode`
- No dedicated `integrations.test.ts` section was found for `pi`

Confirmed missing surfaces discussed in planning:

- Codex has source and unit coverage, but still has no dedicated e2e lane
- OpenCode has source and unit coverage, but still has no dedicated e2e lane
- Pi is the weakest current surface: no dedicated unit section, no dedicated e2e lane, no dedicated payload helpers
- Codex, OpenCode, and Pi still do not have dedicated payload-helper sections in `__tests__/e2e/helpers/payloads.ts`
- integration-specific handler coverage is shallow across the whole branch
- persistence, dashboard-field, transcript-path, and virtual-mirror assertions are still weak or missing across several integrations
- cross-version compatibility remains mostly unproven
- scope interactions and dedup behavior still need stronger regression coverage

---

## 4. Cross-Integration Pending Matrix

**Simple View**

Most of the missing work is not in “writing integration source from zero.”
Most of the missing work is in proving the source with the right tests.

Use this matrix when you want to decide where to work next by layer instead of by integration.

**Expert View**

Status meanings:

- `Partially Covered`: dedicated tests exist, but deep checklist coverage is still missing
- `Weakly Covered`: some direct or incidental coverage exists, but the layer is not reliable yet
- `Largely Missing`: the layer has little or no dependable test surface

| Layer | Current Status | What Matters | What Still Needs Tests |
|---|---|---|---|
| Install / uninstall | Partially covered | Hooks must install in the right file, preserve user config, stay idempotent, and uninstall cleanly | Stronger idempotence, byte-preservation, no-project-file, and cross-scope safety checks across all integrations |
| Command format and binary resolution | Partially covered | Native event names and command shape are part of integration identity | More assertions for native event casing, `FAILPROOFAI_DIST_PATH`, quoting, platform path behavior, and older-handler compatibility |
| Event firing reality | Partially covered | A supported event list is useless if real native events do not reach the handler correctly | More event-by-event coverage, especially for Codex, OpenCode, and Pi, plus empty-stdin and block-path behavior |
| Canonical event mapping | Partially covered | Native event names must map to the same internal event language used by policies and the dashboard | More regression tests for Copilot camelCase, Codex snake_case, Gemini PascalCase, and unknown-event fallback |
| Payload normalization | Weakly covered | Policy logic depends on normalized tool name, tool input, cwd, and session fields | More deep-shape, malformed-value, nested-data, null-handling, and stringified-JSON tests |
| Detection and attribution | Weakly covered | The handler must know which integration a payload belongs to, even when signals conflict | More explicit precedence tests for `--integration`, `payload.integration`, unique event names, and negative detect samples |
| Session ID extraction | Weakly covered | Wrong or blank session ids break grouping, persistence, and dashboard navigation | More empty-stdin, env fallback, nested session-field, and same-session-across-events coverage |
| Policy evaluation | Partially covered | After normalization, allow, deny, and instruct must still behave correctly per integration protocol | More protocol-specific decision-format tests, non-git stop behavior, and normalized command parsing coverage |
| Deduplication | Weakly covered | Two hooks must not double-log the same event, but real distinct events must still be recorded | More lifecycle-window, cross-scope, same-command, and integration-in-fingerprint coverage |
| Persistence / dashboard fields | Largely missing | The stored record is what the dashboard actually renders | More checks for integration label, session id, raw hook name, canonical event name, stats, and decision fields |
| Transcript and virtual mirror behavior | Largely missing | Non-Claude sessions must still connect to transcript paths and mirrored project views | More tests for transcript derivation, mirror paths, and dashboard session-detail expectations |
| Scope interactions | Weakly covered | User, project, and local installs change real runtime behavior and duplication risk | More multi-scope install, precedence, dev-dist, and dedup interaction tests |
| Cross-version compatibility | Largely missing | Project-scope installs and older published handlers must still attribute events correctly | More tests around native event self-identification, `npx -y failproofai`, and old-handler fallback behavior |

Interpretation:

- The branch is strongest in install basics, basic mapping, and core policy plumbing
- The branch is weakest in handler attribution depth, session behavior, persistence, transcripts, mirrors, and cross-version safety

---

## 5. Per-Integration Playbooks

### Cursor

**Simple View**

Cursor is an IDE-style integration.
Its main challenge is that hooks can fire from more than one scope, and the payload often describes workspace roots instead of the exact working directory you care about.

This means Cursor work is less about “does it run?” and more about “does it attribute the event correctly and avoid duplicate behavior?”

**Expert View**

**What makes this integration different**

- Cursor-native hook formats and event names
- IDE-style behavior with user and project hooks both capable of firing
- `--stdin` is part of the command contract
- workspace roots are often the first cwd signal
- MCP events must map correctly to canonical tool events

**What already exists in this branch**

- source implementation exists
- dedicated `integrations.test.ts` section exists
- dedicated `cursor-integration.e2e.test.ts` exists
- dedicated `CursorPayloads` helper exists
- handler coverage for Cursor-specific attribution and dedup behavior is still shallow

**Known regression risks**

- twin-fire dedup across user and project scope
- cwd lifted from `workspace_roots[0]`
- more specific subfolder cwd overriding workspace root when tool input contains it
- MCP event mapping into `PreToolUse` and `PostToolUse`
- non-Claude policy behavior staying correct under Cursor protocol

**Tests that must exist**

- unit tests for detection, event mapping, settings-path shape, and command generation
- handler tests for attribution precedence, session fallback, dedup, and cwd override behavior
- e2e tests for real deny, allow, install, uninstall, and protocol-compliant decision handling
- payload fixtures that cover shell, file, MCP, and subfolder-cwd cases

**What is still pending right now**

- deeper handler attribution coverage
- stronger dedup regression tests
- more persistence and dashboard-field assertions
- mirror and transcript-related coverage
- more MCP deep-case coverage
- fuller event-reality coverage for Cursor-native events such as shell, file, and MCP paths
- stronger scope-interaction coverage for user plus project hook coexistence

**Exact next work order**

1. Extend fixtures only where current Cursor payloads are still too shallow
2. Fill unit gaps in `__tests__/hooks/integrations.test.ts`
3. Add Cursor-specific handler tests in `__tests__/hooks/handler.test.ts`
4. Add only the highest-value new e2e flows after the handler gaps are proven
5. Fix source only after a failing test shows the exact break

### Gemini

**Simple View**

Gemini is the deep-data integration.
Its danger is not only event identity.
Its danger is that useful values can be buried in nested payload shapes.

If Gemini work is done badly, policies still run, but they run on the wrong extracted data.

**Expert View**

**What makes this integration different**

- Gemini-native PascalCase event names
- deeply nested payload shapes
- deep extraction from fields like `parts`, `arguments`, and `call.method`
- transcript paths derived into Gemini-specific chat storage

**What already exists in this branch**

- source implementation exists
- dedicated `integrations.test.ts` section exists
- dedicated `gemini-integration.e2e.test.ts` exists
- dedicated `GeminiPayloads` helper exists
- handler coverage for Gemini-specific attribution and session behavior is still shallow

**Known regression risks**

- deep extraction from nested data
- PascalCase identity guard when `--integration` is missing
- transcript-path resolution for dashboard use
- wrong or partial normalization of text, args, or tool name
- fallback to Claude identity when only Gemini-native event naming should decide

**Tests that must exist**

- unit tests for deep extraction, detection, event mapping, and settings path
- handler tests for attribution without explicit flag, session handling, and transcript derivation
- e2e tests for deny and allow flows plus richer native-event coverage
- payload fixtures that cover nested method calls, `parts`, `arguments`, and odd-shaped values

**What is still pending right now**

- richer deep fixtures
- more attribution-without-flag tests
- deeper persistence, transcript, and dashboard assertions
- stronger session-fallback coverage
- more complete event-by-event native-shape coverage
- more realistic nested payload coverage for `parts`, `arguments`, and `call.method`
- stronger transcript-path and mirror-path regression coverage

**Exact next work order**

1. Deep fixtures first
2. Unit normalization and detection tests second
3. Handler attribution, transcript, and session tests third
4. E2E additions last
5. Fix source only after a failing test proves the branch that broke

### Copilot

**Simple View**

Copilot is the most branch-sensitive integration right now.
It has real code and real tests, but it also has the heaviest history of regressions.

Its biggest dangers are:

- being mislabeled as Claude
- losing the session id in the dashboard
- parsing `toolArgs` incorrectly
- sync and snap behavior quietly damaging the install

**Expert View**

**What makes this integration different**

- camelCase native event names
- settings surface at `~/.copilot/config.json`
- sync engine that merges project hooks into the user config
- snap revision repair behavior
- stringified JSON normalization through fields like `toolArgs`

**What already exists in this branch**

- source implementation exists
- dedicated `integrations.test.ts` section exists
- dedicated `copilot-integration.e2e.test.ts` exists
- dedicated `CopilotPayloads` helper exists
- Copilot utility coverage exists for sync helpers
- handler coverage for deeper Copilot attribution, session fallback, persistence, and silence-guard behavior is still shallow

**Known regression risks**

- Copilot events labeled as Claude
- blank session id on the dashboard
- user-scope hooks wiped by `synchronizeCopilotProjectHooks`
- malformed or stringified `toolArgs`
- silence guard for legacy wrong-Claude hook firings
- snap revision hook-path behavior
- heuristic detection when explicit integration metadata is missing

**Tests that must exist**

- unit tests for sync helpers, event mapping, native command shape, `toolArgs` parsing, and detect logic
- handler tests for session fallback, persistence labeling, silence guard, env recovery, and transcript path derivation
- e2e tests for allow, deny, install, uninstall, sync safety, and regression-heavy payload shapes
- payload fixtures that cover good JSON, bad JSON, nested data, empty input, and env fallback cases

**What is still pending right now**

- malformed `toolArgs` handling tests
- env fallback and session synthesis tests
- stronger persistence assertions for integration label and session id
- snap and sync branch coverage
- deeper silence-guard and heuristic-detect coverage
- fuller event-reality coverage for all 8 Copilot native events
- stronger transcript-path derivation coverage for `~/.copilot/session-state/<id>/events.jsonl`
- better install-command regression coverage for camelCase native hook names

**Exact next work order**

1. Expand Copilot fixtures
2. Fill unit gaps in normalize, detect, and sync helpers
3. Add handler tests for session, attribution, silence guard, and persistence
4. Add targeted e2e regression flows
5. Fix source only after a failing test shows the specific break

### Codex

**Simple View**

Codex is implemented in source, but its proof surface is incomplete.
The biggest current issue is not that Codex has no logic.
The biggest issue is that Codex does not yet have its own dedicated e2e lane or payload helper lane in this branch.

**Expert View**

**What makes this integration different**

- snake_case native events
- handler mapping from snake_case to canonical PascalCase
- legacy CLI compatibility concerns
- trace-related metadata and parsing expectations

**What already exists in this branch**

- source implementation exists
- dedicated `integrations.test.ts` section exists
- no dedicated `codex-integration.e2e.test.ts` was found
- no dedicated Codex payload helper section was found in `__tests__/e2e/helpers/payloads.ts`
- handler coverage for Codex identity and session behavior is still shallow

**Known regression risks**

- snake_case identity stability
- wrong attribution to another integration when the handler must decide from event naming
- cross-version fallback when older handlers ignore the integration flag
- trace-related behavior and metadata expectations
- past risk of lifecycle events being misattributed

**Tests that must exist**

- unit tests for Codex detection, mapping, settings path, and native command shape
- handler tests for attribution, session extraction, fallback, and persistence labeling
- dedicated `codex-integration.e2e.test.ts`
- dedicated Codex payload fixtures for pre-tool, post-tool, session, and stop-like events

**What is still pending right now**

- dedicated e2e surface is missing
- dedicated payload helper surface is missing
- deeper handler attribution and session coverage is missing
- persistence, transcript, and cross-version compatibility coverage is weak
- explicit event-reality coverage for `pre_tool_use`, `post_tool_use`, `session_start`, `session_end`, `user_prompt_submitted`, `agent_stop`, and `notification`
- stronger trace-related and old-handler fallback coverage is still missing

**Exact next work order**

1. Create Codex fixture shapes first
2. Expand unit coverage second
3. Add Codex-specific handler tests third
4. Add the first dedicated Codex e2e vertical slice last
5. Fix source only when the new failing test proves the gap

### OpenCode

**Simple View**

OpenCode is plugin-shaped, not just config-shaped.
That means the integration is only healthy when the wrapper and the handler both behave correctly.

Its biggest dangers are:

- blocking must be honored immediately
- stderr noise can break the plugin protocol
- session state must remain stable across calls

**Expert View**

**What makes this integration different**

- plugin-based wrapper flow
- synchronous CLI blocking behavior
- dotted native event names
- stderr/JSON protocol sensitivity
- session state may be held or forwarded by the plugin wrapper

**What already exists in this branch**

- source implementation exists
- dedicated `integrations.test.ts` section exists
- no dedicated `opencode-integration.e2e.test.ts` was found
- no dedicated OpenCode payload helper section was found
- handler coverage for OpenCode-specific silence, session, and persistence behavior is still shallow

**Known regression risks**

- wrapper must block correctly when the CLI denies
- stderr leakage can break OpenCode protocol handling
- session persistence across plugin calls
- dotted-event attribution and canonicalization
- session-created versus later tool events staying grouped together

**Tests that must exist**

- unit tests for detection, mapping, settings path, and wrapper-related assumptions
- handler tests for attribution, session grouping, silence on success, and persistence fields
- dedicated `opencode-integration.e2e.test.ts`
- dedicated OpenCode payload helpers for session start, tool before, tool after, and chat/message flows

**What is still pending right now**

- dedicated e2e surface is missing
- dedicated payload helper surface is missing
- stronger handler silence and session tests are missing
- persistence and dashboard-focused coverage is weak
- explicit event-reality coverage for `session.created`, `session.idle`, `tool.execute.before`, `tool.execute.after`, and `chat.message` is still missing
- stronger wrapper-blocking and stderr-cleanliness regression coverage is still missing

**Exact next work order**

1. Add plugin-style payload fixtures first
2. Expand unit behavior coverage second
3. Add handler silence, attribution, and session tests third
4. Add OpenCode e2e blocking and success flows last
5. Fix source only after the failing test identifies the broken branch

### Pi

**Simple View**

Pi is the weakest-tested integration in this branch.
The source exists, but the supporting proof surfaces are thin.

That makes Pi high risk even before you find a bug.

**Expert View**

**What makes this integration different**

- extension-based wrapper
- session handoff from extension context
- IDE-style user feedback through status UI
- recursive isolation concerns
- inheritance-style keys such as `codex_session_id`

**What already exists in this branch**

- source implementation exists
- no dedicated Pi section was found in `__tests__/hooks/integrations.test.ts`
- no dedicated `pi-integration.e2e.test.ts` was found
- no dedicated Pi payload helper section was found
- handler coverage for Pi-specific session, attribution, and status behavior is still shallow

**Known regression risks**

- missing or unstable session ids
- deny flow not surfacing status UI feedback
- recursive self-trigger loops
- inherited metadata keys not being honored
- wrong attribution or grouping when the wrapper sends sparse payloads

**Tests that must exist**

- first dedicated Pi unit section in `__tests__/hooks/integrations.test.ts`
- handler tests for session extraction, attribution, recursive isolation, and persistence
- dedicated `pi-integration.e2e.test.ts`
- dedicated Pi payload helpers for session start, tool call, tool result, and UI-feedback deny cases

**What is still pending right now**

- dedicated unit surface is missing
- dedicated e2e surface is missing
- dedicated payload helper surface is missing
- deeper handler coverage is missing
- persistence and session-label behavior remains weakly proven
- explicit event-reality coverage for `session_start`, `tool_call`, `tool_result`, and `input` is still missing
- UI feedback behavior and recursive-isolation regressions still need dedicated proof
- inherited metadata handling such as `codex_session_id` and `codex_event` still needs direct tests

**Exact next work order**

1. Define Pi payload shapes first
2. Add the first dedicated Pi unit section second
3. Add Pi-specific handler tests third
4. Add the first Pi e2e flow last
5. Fix source only after a failing test makes the break concrete

---

## 6. How To Convert A Pending Row Into Tests

**Simple View**

Do not fix a pending gap by jumping straight into source code.
First convert the gap into the smallest useful test shape.

Use this order every time:

1. fixture first
2. unit second
3. handler third
4. e2e last
5. fix code only after the failing test proves the bug

**Expert View**

### Map each kind of missing work to the right file

| Missing Work Type | Put It Here | What It Should Prove |
|---|---|---|
| Integration object behavior | `__tests__/hooks/integrations.test.ts` | settings paths, event maps, detect logic, command shape, helper utilities |
| Handler and runtime behavior | `__tests__/hooks/handler.test.ts` | attribution precedence, session extraction, fallback logic, persistence fields, silence guard, transcript path |
| Payload builders | `__tests__/e2e/helpers/payloads.ts` | realistic native payload shapes for each integration |
| End-to-end integration flows | `__tests__/e2e/hooks/<integration>-integration.e2e.test.ts` | install, run, allow, deny, protocol contract, uninstall, high-value regressions |

### Biggest missing surfaces right now

- `codex-integration.e2e.test.ts` does not exist
- `opencode-integration.e2e.test.ts` does not exist
- `pi-integration.e2e.test.ts` does not exist
- Codex payload helpers do not have a dedicated section
- OpenCode payload helpers do not have a dedicated section
- Pi payload helpers do not have a dedicated section
- Pi does not have a dedicated integration unit section
- integration-specific handler coverage is still shallow across the branch
- persistence, dashboard, transcript, and virtual-mirror coverage remains weak or missing across several integrations

### First missing files and first tests to add later

| First Missing File Or Area | First High-Value Tests |
|---|---|
| `__tests__/e2e/helpers/payloads.ts` for Codex | snake_case native event payloads, session fallback payloads, stop/session lifecycle payloads |
| `__tests__/e2e/helpers/payloads.ts` for OpenCode | plugin-style session-created and tool-before/tool-after payloads, stderr-sensitive success payloads |
| `__tests__/e2e/helpers/payloads.ts` for Pi | extension session payloads, deny-with-status payloads, recursive-isolation payloads |
| `__tests__/e2e/hooks/codex-integration.e2e.test.ts` | install, one deny flow, one allow flow, old-handler/native-event attribution regression |
| `__tests__/e2e/hooks/opencode-integration.e2e.test.ts` | wrapper blocking, clean success path, silence-on-success regression |
| `__tests__/e2e/hooks/pi-integration.e2e.test.ts` | session propagation, deny feedback, recursive isolation |
| `__tests__/hooks/integrations.test.ts` for Pi | detect logic, settings path, event mapping, payload normalization entry points |
| `__tests__/hooks/handler.test.ts` across all | attribution precedence, session fallback, persistence fields, transcript-path derivation, silence-guard regressions |

### Practical conversion examples

If the pending row is “wrong integration label on dashboard”:

- add or expand handler tests first
- assert persisted `integration`
- then add e2e only if the bug depends on full CLI flow

If the pending row is “payload shape is weird”:

- add fixtures first
- add unit normalization tests second
- add handler tests third

If the pending row is “install or uninstall broke user config”:

- add unit tests around helper behavior
- add e2e only if file-on-disk flow matters

If the pending row is “agent did not stop on deny”:

- add e2e because full protocol behavior matters
- add unit or handler tests only for the branches that explain why it broke

### How To Build A Gap Table

Before implementation, write a small truth table for the integration you are touching.

Use columns like:

| Check | Status |
|---|---|
| Install works | yes / no |
| Uninstall works | yes / no |
| Events fire | yes / no |
| Session id correct | yes / no |
| Dashboard integration correct | yes / no |
| Policies work | yes / no |
| Unit tests exist | yes / no |
| Handler tests exist | yes / no |
| E2E tests exist | yes / no |

If you want a richer version, use:

| Case | Source Exists | Unit Test Exists | Handler Test Exists | E2E Test Exists | Status |
|---|---|---|---|---|---|
| Copilot `toolArgs` JSON parse | yes | yes / no | yes / no | yes / no | green / yellow / red |

Simple status meanings:

- `green`: implemented and tested well
- `yellow`: implemented, but weakly tested
- `red`: missing or still risky

### What A Good Test Looks Like

Use one test name for one behavior.

Good examples:

- `maps errorOccurred to Stop`
- `preserves user scope when no project file`
- `uses COPILOT_SESSION_ID when payload is empty`

Bad tests usually have these problems:

- too many unrelated assertions
- too much fixture setup repeated inline
- failure message does not explain the bug

The best test order in this repo is still:

1. payload fixture
2. unit test
3. handler test
4. e2e

### Useful Commands

These are the most useful commands when doing the real implementation work later:

```bash
git branch --show-current
bunx vitest run __tests__/hooks/integrations.test.ts
bunx vitest run __tests__/hooks/handler.test.ts
bunx vitest run --config vitest.config.e2e.mts __tests__/e2e/hooks/copilot-integration.e2e.test.ts
bun run test:run
bun run test:e2e
bun run lint
bunx tsc --noEmit
```

After non-trivial changes in `src/hooks/` or `package.json`, also run the Docker smoke test from `AGENTS.md`.

Before pushing, follow the repo rules in `AGENTS.md`:

```bash
git fetch origin && git log --oneline origin/main ^HEAD
gh pr list --head "$(git branch --show-current)"
gh run list --limit 3
```

### Reusable Pattern For Future Integrations

For future integrations, reuse this same build order:

1. add or confirm native event definitions in `src/hooks/types.ts`
2. add or confirm integration behavior in `src/hooks/integrations.ts`
3. confirm handler attribution and session flow in `src/hooks/handler.ts`
4. add payload builders
5. add unit tests
6. add handler tests
7. add the first dedicated e2e file

That pattern is safer than shipping “mostly working” source without proof.

---

## 7. Named Regression Index

**Simple View**

These are not abstract risks.
These are the kinds of bugs that can confuse users, hide events, or make a working integration look broken.

Every row below should stay tied to a named test or named test area.

**Expert View**

| Regression | Affected Integration(s) | Test Name / Test Area | User-Visible Symptom |
|---|---|---|---|
| Copilot events labeled as Claude | Copilot | `copilot > native camelCase event names install` and handler attribution coverage | Dashboard shows Copilot activity as Claude activity |
| Copilot session id blank on dashboard | Copilot | `copilot > fallback sessionId synthesized` and handler session extraction coverage | Session page shows blank or dash-style session id |
| Copilot sync wiping user-scope hooks | Copilot | `copilot-sync > preserves user scope when no project file` | Copilot hooks disappear after install, sync, or terminal startup |
| Copilot `toolArgs` string handling | Copilot | `copilot > normalize parses toolArgs JSON` and malformed-string variants | Policies see raw strings, wrong commands, or crash-prone input |
| Codex / Copilot / Gemini attribution mistakes | Codex, Copilot, Gemini | handler attribution precedence coverage | Events land under the wrong integration and dashboard/policies look inconsistent |
| Codex SessionStart mis-attributed to Gemini | Codex, Gemini | `handler > --integration flag wins over event-name` | Session activity shows under the wrong agent family |
| Old handler fallback with `npx -y failproofai` | Codex, Copilot, older published handler paths | `cross-version > event-name fallback attributes correctly on old handler` | Project-scope installs behave differently on older published versions |
| Lifecycle dedup swallowing real events | All, especially session lifecycle flows | `dedup > lifecycle uses 5s window + sessionId` | Real session start or stop events disappear from logs |
| Cursor non-Claude policy bypass behavior | Cursor | `policy > warn-repeated-tool-calls tunes for non-Claude` and related policy/evaluator coverage | Policy feels active in Claude but not in Cursor |
| OpenCode / Pi stderr protocol leakage | OpenCode, Pi | `opencode/pi > handler silent on success` | Wrapper or client protocol breaks because unexpected stderr appears |
| Convention hooks not loading | Convention policy system across integrations | `custom-hooks > convention files loaded per scope` | Policy files exist, but nothing runs and the user thinks hooks are broken |

Interpretation:

- if a row here has no obvious dedicated test, that is active debt
- if a regression returns, update both the test surface and this index

---

## 8. Closeout Checklist Before Saying “Done”

**Simple View**

Do not stop when the code “looks fine.”
Stop when the branch truth has improved and the proof matches the claim.

**Expert View**

- [ ] I used this file as a snapshot of the current branch, not as a fantasy roadmap
- [ ] I checked `__tests__/INTEGRATION_TEST_CASES.md` for deeper contract details
- [ ] I know which integration I am working on
- [ ] I know which layer is actually failing: install, mapping, normalization, attribution, session, persistence, or e2e protocol
- [ ] I created or updated payload fixtures before writing high-level tests
- [ ] I added or planned the right unit coverage in `__tests__/hooks/integrations.test.ts`
- [ ] I added or planned the right handler coverage in `__tests__/hooks/handler.test.ts`
- [ ] I added or planned the right e2e coverage in `__tests__/e2e/hooks/<integration>-integration.e2e.test.ts`
- [ ] I did not count shallow incidental coverage as proof
- [ ] I did not fix source code before a failing test made the break specific
- [ ] I checked whether the change affects dashboard fields, transcripts, mirrors, or dedup behavior
- [ ] I updated the guide again if the branch truth changed materially

Final reminder:
this guide is strongest when it stays honest.
If the branch still has a gap, write the gap down clearly instead of hiding it behind “mostly working.”

### Common Mistakes To Avoid

- trusting the dashboard alone
- calling something “done” because one event appeared once
- skipping handler tests because unit tests already pass
- writing source changes before a failing test proves the branch that broke
- working on many integrations at the same time
- assuming shallow coverage is the same as strong coverage

### If You Only Have 2 Days

Do not try to finish six integrations badly.

Use the time like this:

1. Pick the riskiest single integration
2. Build the gap table
3. Add fixtures
4. Fill unit and handler gaps
5. Add or expand one real e2e lane
6. Fix only the bugs the tests expose

That creates one reliable template instead of many unstable partial wins.

### Final Instruction For The Next Person

If you are unsure what to do next, do this exact sequence:

1. Open this guide
2. Find your integration in Section 5
3. Read its “What is still pending right now” block
4. Turn the first pending item into a fixture, unit test, handler test, or e2e test
5. Run the smallest useful test first
6. Fix source only after the failing test proves the bug

That is the safest path through this codebase.
