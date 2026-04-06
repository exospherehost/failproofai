# Dashboard

The failproofai dashboard is a local web application for browsing Claude Code sessions and managing security policies.

---

## Starting the dashboard

```bash
failproofai
```

Opens at `http://localhost:8020`.

For production mode (faster startup, no file watching):

```bash
failproofai --start
```

The dashboard reads directly from the filesystem — your Claude Code project folders and the failproofai config files. Nothing is written to a remote service.

---

## Pages

### Projects

Lists all Claude Code projects found on your machine. Projects are discovered from `~/.claude/projects/` (or the path set by `CLAUDE_PROJECTS_PATH`).

Each project shows:
- Project name (derived from the folder path)
- Number of sessions
- Date of most recent session activity

Click a project to see its sessions.

### Sessions

Lists all sessions within a project. Each session shows:
- Session ID
- Start and end timestamps
- Number of tool calls
- Hook activity count (policies that fired)

Use the date range filter and session ID search to narrow the list. Sessions are paginated.

Click a session to open the session viewer.

### Session viewer

A timeline of everything that happened in a session:

- **Messages** — Claude's text responses and user prompts
- **Tool calls** — Every tool Claude invoked, with its input and output
- **Hook activity** — For each tool call, which policies fired and what decision they returned

The stats bar at the top shows session duration, total tool calls, and a summary of hook decisions (allow / deny / instruct counts).

You can export the session as a ZIP or JSONL file using the download button.

### Policies

A two-tab page for managing policies and reviewing activity.

**Policies tab:**

- Toggle individual policies on or off with a single click (writes to `~/.failproofai/hooks-config.json`)
- Expand a policy to configure its parameters (for policies that support `policyParams`)
- Install or remove hooks for a given scope
- Set a custom hooks file path

**Activity tab:**

- Full paginated history of every hook event that has fired across all sessions
- Search by policy name, session ID, tool name, or decision
- Each row shows: timestamp, policy name, decision, tool name, session ID, and the reason for deny/instruct decisions

---

## Auto-refresh

The dashboard has an auto-refresh toggle in the top navigation. When enabled, the current page refreshes periodically to show new sessions and hook activity as they appear. Useful when you have an active Claude Code session running in parallel.

---

## Disabling pages

If you only need some parts of the dashboard, set `FAILPROOFAI_DISABLE_PAGES` to a comma-separated list of page names:

```bash
FAILPROOFAI_DISABLE_PAGES=policies failproofai
```

Valid values: `policies`, `projects`.

---

## Theme

The dashboard supports light and dark mode. Toggle via the button in the navigation bar. The preference is stored in your browser's local storage.

---

## Configuring the projects path

By default, the dashboard reads from the standard Claude Code projects directory. Override it for custom setups:

```bash
CLAUDE_PROJECTS_PATH=/custom/path/to/projects failproofai
```
