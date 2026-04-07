# CLI Reference

All commands are invoked via the `failproofai` binary.

---

## Launch the dashboard

```bash
failproofai
failproofai --start
```

Starts the web dashboard at `http://localhost:8020`. Use `--start` for production mode (Next.js standalone). The default bare invocation uses development mode with auto-reload.

**Options (dev mode only):**

| Flag | Description |
|------|-------------|
| `--port <number>` | Port to listen on (default: `8020`) |
| `--projects-path <path>` | Override the Claude projects path |
| `--allowed-origins <origins>` | Comma-separated list of hosts/IPs allowed to access dev resources (e.g. HMR websocket). Required when accessing the dev server from a hostname other than `localhost`. |

**Example — allow a custom hostname in dev:**

```bash
npm run dev -- --allowed-origins dashboard.example.com
# or multiple:
npm run dev -- --allowed-origins dashboard.example.com,192.168.1.5
```

You can also set the env var directly instead of using the flag:

```bash
FAILPROOFAI_ALLOWED_DEV_ORIGINS=dashboard.example.com npm run dev
```

---

## Hook handler (internal)

```bash
failproofai --hook <EventType>
```

This is the command written into Claude Code's `settings.json` by `--install-policies`. You will not normally call this directly.

**EventType** is one of: `PreToolUse`, `PostToolUse`, `Notification`, `Stop`.

Reads a JSON payload from stdin, evaluates all enabled policies, writes a decision to stdout, and exits.

---

## Install policies

```bash
failproofai --install-policies [policy-names...] [options]
```

Writes hook entries into Claude Code's `settings.json` so that failproofai intercepts tool calls.

**Options:**

| Flag | Description |
|------|-------------|
| `--scope user` | Install into `~/.claude/settings.json` (default — all sessions) |
| `--scope project` | Install into `.claude/settings.json` in the current directory |
| `--scope local` | Install into `.claude/settings.local.json` in the current directory |
| `--custom-hooks <path>` | Path to a JS file containing custom hook policies |
| `--beta` | Include beta policies in installation |

**Examples:**

```bash
# Install all default policies globally
failproofai --install-policies

# Install two specific policies for the current project
failproofai --install-policies block-sudo sanitize-api-keys --scope project

# Install with a custom hooks file
failproofai --install-policies --custom-hooks ./my-policies.js
```

When `--custom-hooks <path>` is provided, the resolved absolute path is saved to `hooks-config.json` as `customHooksPath`. The file is loaded and executed at hook-fire time (not at install time).

---

## Remove policies

```bash
failproofai --remove-policies [policy-names...] [options]
```

Removes failproofai hook entries from Claude Code's `settings.json`.

**Options:**

| Flag | Description |
|------|-------------|
| `--scope user` | Remove from global settings (default) |
| `--scope project` | Remove from project settings |
| `--scope local` | Remove from local settings |
| `--scope all` | Remove from all scopes |
| `--remove-custom-hooks` | Clear the `customHooksPath` from config |

**Examples:**

```bash
# Remove all policies globally
failproofai --remove-policies

# Remove a specific policy
failproofai --remove-policies block-sudo

# Remove custom hooks path
failproofai --remove-policies --remove-custom-hooks
```

---

## List policies

```bash
failproofai --list-policies
```

Prints all available policies with their status, configured parameters, and custom hooks.

**Sample output:**

```
Failproof AI Hook Policies (user)

  Status  Name                          Description
  ──────  ──────────────────────────────────────────────────────────────
  ✓       block-sudo                    Block sudo commands
            allowPatterns: ["sudo systemctl status"]
  ✓       block-rm-rf                   Block recursive deletions
  ✗       block-curl-pipe-sh            Block curl|bash patterns
  ✓       sanitize-api-keys             Redact API keys from output
            additionalPatterns: [{ regex: "MY_TOKEN_...", label: "..." }]

  ── Custom Hooks (/home/alice/myproject/my-policies.js) ──────────────
  ✓       require-jira-ticket           Block commits without ticket
  ✓       approval-gate                 Approval gate for destructive ops
```

Unknown keys in `policyParams` are flagged here (not at hook-fire time, so you can catch typos).

---

## Print version

```bash
failproofai --version
```

Prints the installed version number.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `FAILPROOFAI_TELEMETRY_DISABLED=1` | Disable anonymous usage telemetry |
| `FAILPROOFAI_LOG_LEVEL=info\|warn\|error` | Server log level (default: `warn`) |
| `FAILPROOFAI_DISABLE_PAGES=policies,projects` | Comma-separated list of dashboard pages to disable |
| `FAILPROOFAI_ALLOWED_DEV_ORIGINS` | Comma-separated list of hosts/IPs allowed to access Next.js dev resources (HMR). Dev mode only. Equivalent to `--allowed-origins`. |
| `CLAUDE_PROJECTS_PATH` | Override the path where Claude Code project folders are found |
