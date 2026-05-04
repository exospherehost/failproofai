You are an automated agent running in GitHub Actions to keep failproofai's hook
event types in sync with the upstream documentation for **every** agent CLI we
integrate with.

failproofai integrates with seven agent CLIs. Each one has its own hook event
surface, tracked as a separate `as const` array in `src/hooks/types.ts`:

| CLI            | Array constant              | Casing convention | Has `*EVENT_MAP`? |
|----------------|-----------------------------|-------------------|--------------------|
| Claude Code    | `HOOK_EVENT_TYPES`          | PascalCase        | no (canonical)     |
| OpenAI Codex   | `CODEX_HOOK_EVENT_TYPES`    | snake_case        | yes (`CODEX_EVENT_MAP`) |
| GitHub Copilot | `COPILOT_HOOK_EVENT_TYPES`  | PascalCase        | no                 |
| Cursor Agent   | `CURSOR_HOOK_EVENT_TYPES`   | camelCase         | yes (`CURSOR_EVENT_MAP`) |
| OpenCode       | `OPENCODE_HOOK_EVENT_TYPES` | dot.namespaced    | yes (`OPENCODE_EVENT_MAP`) |
| Pi             | `PI_HOOK_EVENT_TYPES`       | snake_case        | yes (`PI_EVENT_MAP`) |
| Gemini CLI     | `GEMINI_HOOK_EVENT_TYPES`   | PascalCase        | yes (`GEMINI_EVENT_MAP`) |

## Your task

### 1. Fetch upstream docs and extract the canonical event-name list per CLI

| CLI       | Docs URL(s)                                                                       |
|-----------|------------------------------------------------------------------------------------|
| Claude    | https://code.claude.com/docs/en/hooks (primary, full reference table)             |
|           | https://code.claude.com/docs/en/hooks-guide (secondary, summary table)            |
| Codex     | https://developers.openai.com/codex/hooks                                          |
| Copilot   | https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks |
| Cursor    | https://cursor.com/docs/hooks                                                      |
| OpenCode  | https://opencode.ai/docs/plugins/                                                  |
| Pi        | https://www.npmjs.com/package/@mariozechner/pi-coding-agent                        |
| Gemini    | https://geminicli.com/docs/hooks/                                                  |

For each CLI, use `WebFetch` on its docs URL(s) and extract the complete list of
hook event-type names from the lifecycle / triggers / "Available events" table
or section. Where two URLs are listed (Claude only), union the results and
prefer the reference page if they disagree.

**Use the upstream casing exactly as it appears in the docs.** Do not normalize:
- Codex really is snake_case (`pre_tool_use`, `permission_request`, …).
- Cursor really is camelCase (`preToolUse`, `beforeSubmitPrompt`, …).
- OpenCode really is dot-namespaced (`tool.execute.before`, `session.idle`, …).
- Pi really is snake_case (`tool_call`, `user_bash`, `session_shutdown`, …).

If a docs URL returns 404, redirects to a stub, or the page does not expose a
parseable event list, mark that CLI as `unverified` for this run and skip its
diff. **Do not invent events. Do not guess from prior knowledge.** Pi is the
most likely `unverified` candidate because its event surface is documented
primarily in the package source (`@mariozechner/pi-coding-agent` on npm), and
the README may not include a clean enumeration.

### 2. Read the current array values

Read `src/hooks/types.ts` and extract the current value of each
`*HOOK_EVENT_TYPES` array.

### 3. Diff each verified CLI

For every verified CLI, compute:
- **added**: events in upstream docs but NOT in the array
- **removed**: events in the array but NOT in upstream docs

### 4. If no verified CLI has drift

Write the following JSON to `.sync-hook-events-output.json` in the repo root:
```json
{ "changed": false }
```
Then stop. (`unverified` alone is NOT drift — the docs may simply be unreachable
today.)

### 5. If one or more verified CLIs have drift

#### a. Update arrays in `src/hooks/types.ts`

For each CLI with drift:
- **Append additions** just before `] as const`, preserving casing.
- **Delete removals** from the array. If the CLI has an `*EVENT_MAP` (see the
  table at the top), also delete the same key from that map block — TypeScript's
  `Record<XxxHookEventType, HookEventType>` is exhaustive, and a stale key would
  fail the build.

#### b. Update hardcoded test counts (only two CLIs need this)

Other CLIs reference `*HOOK_EVENT_TYPES.length` directly in tests, so no
hardcoded-count fixup is needed for them.

- If `HOOK_EVENT_TYPES` (Claude) changed: in `__tests__/hooks/manager.test.ts`,
  update the test description string `installs hooks for all <N> event types`
  AND both `expect(Object.keys(written.hooks)).toHaveLength(<N>)` assertions to
  the new total.
- If `GEMINI_HOOK_EVENT_TYPES` changed: in `__tests__/hooks/integrations.test.ts`,
  update the `expect(gemini.eventTypes).toHaveLength(<N>)` assertion AND the test
  description string `writeHookEntries writes the matcher-wrapper schema for all
  <N> events with matcher='*'`.

Locate these by searching for the current count number.

#### c. Do NOT add `*EVENT_MAP` entries for newly-added events

Each new agent-side event needs a canonical Claude PascalCase mapping that
requires human judgement (e.g. "is this a `PreToolUse`-class event? a
`SessionStart`? a passthrough no-op?"). For Codex, Cursor, OpenCode, Pi, and
Gemini drift, **leave the corresponding `*EVENT_MAP` untouched**. The
TypeScript build will fail with `Property '<event>' is missing in type
Record<...>` and the `<MAP> keys exactly match` test will fail — both are
intentional and surfaced in the PR body. The reviewer adds the map entries,
pushes a fixup commit, and CI goes green before merge.

For Claude and Copilot drift only, no event map exists — the build stays green
on the auto-commit alone.

#### d. Do NOT touch `GEMINI_TOOL_MAP`

That table maps Gemini's tool names (not event names) and is updated through
a different process. New tools surfaced by Gemini docs are out of scope for
this prompt.

### 6. Write the structured output

Write to `.sync-hook-events-output.json` in the repo root:
```json
{
  "changed": true,
  "diffs": {
    "claude":   { "added": ["..."], "removed": ["..."] },
    "codex":    { "added": [],      "removed": [] },
    "copilot":  { "added": [],      "removed": [] },
    "cursor":   { "added": ["..."], "removed": [] },
    "opencode": { "added": [],      "removed": [] },
    "pi":       { "unverified": true },
    "gemini":   { "added": [],      "removed": [] }
  },
  "prTitle": "[auto] sync hook event types with upstream agent CLI docs",
  "prBody": "<markdown — see below>"
}
```

Include a key for every CLI that was checked. Use `{"unverified": true}` (and
omit `added`/`removed`) for any CLI whose docs could not be parsed.

The `prBody` MUST be a Markdown string containing, in order:

1. **Summary table** — one row per CLI:
   `| CLI | status | added | removed |` where status is one of
   `up to date`, `drift`, or `unverified`.
2. **Per-CLI sections** — one section per CLI with non-empty drift, listing
   added and removed events as bullet lists.
3. **Reviewer checklist** — for every newly-added event in a CLI that has an
   `*EVENT_MAP`, an unchecked checkbox reminding the reviewer to add the
   mapping. Use `"???"` as the canonical value placeholder; **do not guess**:
   ```text
   - [ ] Add `<event>: "???"` to `<MAP_NAME>` in `src/hooks/types.ts`
         (canonical Claude `HookEventType` chosen by reviewer)
   ```
4. **Sources** — a list of the docs URL(s) consulted per CLI.
5. **Unverified notes** — for each `unverified` CLI, one short line explaining
   why (404, page lacked a parseable event list, etc.).
6. **Final note** (verbatim):
   > **CI is expected to fail on this PR if a CLI with an `*EVENT_MAP` gained
   > new events. A reviewer must add the missing map entries before merging.
   > For drift in Claude or Copilot only (no event map), CI should pass on
   > this commit alone. CI must pass and this PR must be reviewed before
   > merging.**

## Constraints

- **Only edit these files**:
  - `src/hooks/types.ts`
  - `__tests__/hooks/manager.test.ts`
  - `__tests__/hooks/integrations.test.ts`
  - `.sync-hook-events-output.json`
- Do NOT run any shell commands (no git, no gh, no bun, no curl).
- Do NOT modify `src/hooks/integrations.ts`, `src/hooks/policy-evaluator.ts`,
  `src/hooks/manager.ts`, `src/hooks/handler.ts`, or any other source file.
- Do NOT add entries to any `*EVENT_MAP` or to `GEMINI_TOOL_MAP` for
  newly-added events. Removing keys from a map when their array entry is
  removed IS allowed (and required to keep the build green).
- Do NOT invent events. If WebFetch fails or the docs don't expose a clean
  event list, mark the CLI `unverified` and move on.
