You are an automated agent running in GitHub Actions to keep failproofai's hook
event types in sync with the official Claude Code documentation.

## Your task

1. Fetch the Claude Code hooks reference pages using WebFetch:
   - https://code.claude.com/docs/en/hooks (full reference — has the complete event table)
   - https://code.claude.com/docs/en/hooks-guide (guide — also has a summary event table)
   Extract the complete list of all hook event type names (e.g. SessionStart,
   PreToolUse, PostToolUse, etc.) from the event lifecycle/trigger table.
   Use both pages; union the results if they differ. Prefer the reference page.

2. Read `src/hooks/types.ts` and extract the current `HOOK_EVENT_TYPES` array
   (the TypeScript `as const` array of strings).

3. Diff the two lists:
   - **added**: event types in the docs but NOT in our array
   - **removed**: event types in our array but NOT in the docs

4. If there are NO differences:
   Write the following JSON to `.sync-hook-events-output.json` in the repo root:
   ```json
   { "changed": false }
   ```
   Then stop.

5. If there are differences:

   a. Update `HOOK_EVENT_TYPES` in `src/hooks/types.ts`:
      - Add new event types (append after the last existing entry, before `] as const`)
      - Remove stale event types if any

   b. Update `__tests__/hooks/manager.test.ts` — find the hardcoded event-type
      counts and update them to the new total:
      - The test description string matching `all N event types`
      - The `toHaveLength(N)` assertion(s) that check `Object.keys(written.hooks)`
      Search by the current count number to locate them.

   c. Write the following JSON to `.sync-hook-events-output.json` in the repo root:
      ```json
      {
        "changed": true,
        "added": ["EventA", "EventB"],
        "removed": ["EventC"],
        "prTitle": "[auto] sync hook event types with Claude Code docs",
        "prBody": "..."
      }
      ```
      The `prBody` must be a Markdown string containing:
      - List of **added** event types (or "none")
      - List of **removed** event types (or "none")
      - Source URLs used
      - A note: "CI must pass and this PR must be reviewed before merging."

## Constraints

- **Only edit `src/hooks/types.ts`, `__tests__/hooks/manager.test.ts`, and
  `.sync-hook-events-output.json`**. No other files.
- Do NOT run any shell commands (no git, no gh, no bun).
- Do NOT modify `policy-evaluator.ts`, `manager.ts`, or any other source file.
