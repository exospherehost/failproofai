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

4. If there are NO differences: print "Hook coverage is up to date. No changes needed."
   and stop.

5. If there are differences:

   a. Update `HOOK_EVENT_TYPES` in `src/hooks/types.ts`:
      - Add new event types (append after the last existing entry, before `] as const`)
      - Remove stale event types if any

   b. Update `__tests__/hooks/manager.test.ts` — find the two hardcoded event-type
      counts and update them to the new total:
      - The test description string matching `all N event types`
      - The `toHaveLength(N)` assertion(s) that check `Object.keys(written.hooks)`
      Search by the current count number to locate them.

   c. Check whether a sync PR already exists to avoid duplicates:
      ```
      gh pr list --base main --search "[auto] sync hook event types" --state open
      ```
      If one is open, print "Sync PR already open. Skipping." and stop.

   d. Create a new branch:
      ```
      git checkout -b auto/sync-hook-events-$(date +%Y%m%d)
      ```

   e. Stage only the two modified files:
      ```
      git add src/hooks/types.ts __tests__/hooks/manager.test.ts
      ```

   f. Commit:
      ```
      git commit -m "feat: sync hook event types with Claude Code docs"
      ```

   g. Push and open a PR:
      ```
      git push origin auto/sync-hook-events-$(date +%Y%m%d)
      gh pr create \
        --title "[auto] sync hook event types with Claude Code docs" \
        --body "..." \
        --base main
      ```
      The PR body must include:
      - List of **added** event types (or "none")
      - List of **removed** event types (or "none")
      - Source URLs used
      - A note: "CI must pass and this PR must be reviewed before merging."

## Constraints

- **Only edit `src/hooks/types.ts` and `__tests__/hooks/manager.test.ts`**. No other files.
- Do NOT run `bun install`, `bun test`, `bun build`, or any compile commands.
- Do NOT modify `policy-evaluator.ts`, `manager.ts`, or any other source file.
- git user identity is already configured by the workflow.
- `gh` is authenticated via `GH_TOKEN` in the environment.
