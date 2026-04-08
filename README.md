```
    ______      _ __                       ____   ___    ____
   / ____/___ _(_) /___  _________  ____  / __/  /   |  /  _/
  / /_  / __ `/ / / __ \/ ___/ __ \/ __ \/ /_   / /| |  / /
 / __/ / /_/ / / / /_/ / /  / /_/ / /_/ / __/  / ___ |_/ /
/_/    \__,_/_/_/ .___/_/   \____/\____/_/    /_/  |_/___/
               /_/
```

# Failproof AI

[![Docs](https://img.shields.io/badge/docs-befailproof.ai-002CA7?style=flat-square)](https://befailproof.ai)
[![npm](https://img.shields.io/npm/v/failproofai?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/exospherehost/failproofai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/exospherehost/failproofai/actions)
[![Discord](https://img.shields.io/discord/1234567890?style=flat-square&label=Discord&color=5865F2)](https://discord.com/invite/zT92CAgvkj)

Open-source hooks, policies, and project visualization for **Claude Code** & the **Agents SDK**.

- **Hooks & Policies** — 35+ built-in security policies that run as Claude Code hooks. Block dangerous commands, sanitize secrets, restrict file access, and more.
- **Custom Policies** — Write your own policies in JavaScript. Same `allow`/`deny`/`instruct` API as built-in policies, with full async support.
- **Policy Parameters** — Tune built-in policies without writing code: configure allowlists, protected branches, thresholds, and custom patterns.
- **Session Viewer** — Browse Claude Code projects and sessions locally. Inspect tool calls, messages, and per-session hook activity side-by-side.

Everything runs locally — no data leaves your machine.

---

## Requirements

- Node.js >= 20.9.0
- Bun >= 1.3.0 (optional — only needed for development / building from source)

---

## Install

```bash
npm install -g failproofai
# or
bun add -g failproofai
```

---

## Quick start

### 1. Enable policies globally

```bash
failproofai --install-policies
```

Writes hook entries into `~/.claude/settings.json`. Claude Code will now invoke failproofai before and after each tool call.

### 2. Launch the dashboard

```bash
failproofai
```

Opens `http://localhost:8020` — browse sessions, inspect logs, manage policies.

### 3. Check what's active

```bash
failproofai --list-policies
```

---

## Policy installation

### Scopes

| Scope | Command | Where it writes |
|-------|---------|-----------------|
| Global (default) | `failproofai --install-policies` | `~/.claude/settings.json` |
| Project | `failproofai --install-policies --scope project` | `.claude/settings.json` |
| Local | `failproofai --install-policies --scope local` | `.claude/settings.local.json` |

### Install specific policies

```bash
failproofai --install-policies block-sudo block-rm-rf sanitize-api-keys
```

### Remove policies

```bash
failproofai --remove-policies
# or for a specific scope:
failproofai --remove-policies --scope project
```

---

## Configuration

Policy configuration lives in `~/.failproofai/policies-config.json` (global) or `.failproofai/policies-config.json` in your project (per-project).

```json
{
  "enabledPolicies": [
    "block-sudo",
    "block-rm-rf",
    "sanitize-api-keys",
    "block-push-master",
    "block-env-files",
    "block-read-outside-cwd"
  ],
  "policyParams": {
    "block-sudo": {
      "allowPatterns": ["sudo systemctl status", "sudo journalctl"]
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"]
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo API key" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  }
}
```

**Three config scopes** are merged automatically (project → local → global). See [docs/configuration.md](docs/configuration.md) for full merge rules.

---

## Built-in policies

| Policy | Description | Configurable |
|--------|-------------|:---:|
| `block-sudo` | Block sudo commands | `allowPatterns` |
| `block-rm-rf` | Block recursive deletions | `allowPaths` |
| `block-curl-pipe-sh` | Block curl\|bash and wget\|bash | |
| `block-failproofai-commands` | Prevent self-uninstallation | |
| `sanitize-jwt` | Redact JWT tokens from tool output | |
| `sanitize-api-keys` | Redact API keys from tool output | `additionalPatterns` |
| `sanitize-connection-strings` | Redact database credentials from tool output | |
| `sanitize-private-key-content` | Redact PEM private key blocks | |
| `sanitize-bearer-tokens` | Redact Authorization Bearer tokens | |
| `block-env-files` | Block access to .env files | |
| `protect-env-vars` | Block commands that print environment variables | |
| `block-read-outside-cwd` | Block reading files outside the project | `allowPaths` |
| `block-secrets-write` | Block writes to private key and certificate files | `additionalPatterns` |
| `block-push-master` | Block pushing to main/master | `protectedBranches` |
| `block-work-on-main` | Block checking out main/master | `protectedBranches` |
| `block-force-push` | Block `git push --force` | |
| `warn-git-amend` | Warn on `git commit --amend` | |
| `warn-git-stash-drop` | Warn on `git stash drop` | |
| `warn-all-files-staged` | Warn on `git add -A` | |
| `warn-destructive-sql` | Warn on DROP/DELETE SQL statements | |
| `warn-schema-alteration` | Warn on ALTER TABLE statements | |
| `warn-large-file-write` | Warn on large file writes | `thresholdKb` |
| `warn-package-publish` | Warn on `npm publish` | |
| `warn-background-process` | Warn on background process launches | |
| `warn-global-package-install` | Warn on global package installs | |
| …and more | | |

Full policy details and parameter reference: [docs/built-in-policies.md](docs/built-in-policies.md)

---

## Custom policies

Create a `.js` file with your own policies:

```js
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  description: "Block writes to paths containing 'production'",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "";
    if (path.includes("production")) return deny("Writes to production paths are blocked");
    return allow();
  },
});
```

Install with:

```bash
failproofai --install-policies --custom ./my-policies.js
```

### Decision helpers

| Function | Effect |
|----------|--------|
| `allow()` | Permit the tool call |
| `deny(message)` | Block the tool call; message shown to Claude |
| `instruct(message)` | Add context to Claude's prompt; does not block |

### Context object (`ctx`)

| Field | Type | Description |
|-------|------|-------------|
| `eventType` | `string` | `"PreToolUse"`, `"PostToolUse"`, `"Notification"`, `"Stop"` |
| `toolName` | `string` | Tool being called (`"Bash"`, `"Write"`, `"Read"`, …) |
| `toolInput` | `object` | Tool's input parameters |
| `payload` | `object` | Full raw event payload |
| `session.cwd` | `string` | Working directory of the Claude Code session |
| `session.sessionId` | `string` | Session identifier |
| `session.transcriptPath` | `string` | Path to the session transcript file |

Custom hooks support transitive local imports, async/await, and access to `process.env`. Errors in custom hooks are fail-open (logged to `~/.failproofai/hook.log`, built-in policies continue). See [docs/custom-hooks.md](docs/custom-hooks.md) for the full guide.

---

## Telemetry

Failproof AI collects anonymous usage telemetry via PostHog to understand feature usage. No session content, file names, tool inputs, or personal information is ever sent.

Disable it:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Installation and first steps |
| [CLI Reference](docs/cli-reference.md) | All commands and flags |
| [Configuration](docs/configuration.md) | Config file format and scope merging |
| [Built-in Policies](docs/built-in-policies.md) | All 35+ policies with parameters |
| [Custom Hooks](docs/custom-hooks.md) | Write your own policies |
| [Dashboard](docs/dashboard.md) | Session viewer and policy management |
| [Architecture](docs/architecture.md) | How the hook system works |
| [Testing](docs/testing.md) | Running tests and writing new ones |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

See [LICENSE](LICENSE).
