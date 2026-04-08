```
    ______      _ __                       ____   ___    ____
   / ____/___ _(_) /___  _________  ____  / __/  /   |  /  _/
  / /_  / __ `/ / / __ \/ ___/ __ \/ __ \/ /_   / /| |  / /
 / __/ / /_/ / / / /_/ / /  / /_/ / /_/ / __/  / ___ |_/ /
/_/    \__,_/_/_/ .___/_/   \____/\____/_/    /_/  |_/___/
               /_/
```

# Failproof AI

[![Docs](https://img.shields.io/badge/docs-befailproof.ai-002CA7?style=flat-square)](https://docs.befailproof.ai)
[![npm](https://img.shields.io/npm/v/failproofai/latest?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/exospherehost/failproofai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/exospherehost/failproofai/actions)

**Don't just hope your agent behaves. Enforce it with hooks.**

Open-source hooks management, policies, and session visualization for **Claude Code** & the **Agents SDK**.

### Why hooks?

Claude Code runs tools on your behalf, but you can't control what it does with just prompts. Hooks let you intercept every tool call and session event so you can block, redirect, or extend behavior with real code. Failproof AI comes with 35+ built-in policies that plug into your hooks to keep agents well-behaved: safe commands, clean git workflows, output sanitization, loop prevention, and more added every release. You can also create your own in JavaScript.

### What you can do

- **Block risky commands** (`rm -rf`, `sudo`, `curl | bash`) before they run
- **Enforce your team's git workflow**: no force-pushes, no commits to main
- **Detect and stop loops** when Claude retries the same failing action
- **Verify task output** before Claude moves on
- **Get Slack notifications** when Claude is idle or finishes a session
- **Sanitize secrets** from tool output so they never reach Claude's context
- **Add project-specific rules** or connect external services in plain JavaScript
- **Browse sessions** in a local dashboard: tool calls, messages, and hook activity

Everything runs locally. No data leaves your machine.

---

## Requirements

- Node.js >= 20.9.0
- Bun >= 1.3.0 (optional, only needed for building from source)

---

## Install

```bash
bun add -g failproofai
# or
npm install -g failproofai
```

---

## Quick start

### 1. Install policies

```bash
failproofai policies --install
```

Registers Failproof AI as a hook handler in `~/.claude/settings.json`. Your policies now run on every tool call and lifecycle event.

### 2. Launch the dashboard

```bash
failproofai
```

Opens `http://localhost:8020`. Browse sessions, inspect policy activity, manage configuration.

### 3. Check what's active

```bash
failproofai policies
```

---

## Policies

Policies are the core primitive in Failproof AI. A policy is a function that runs on a Claude Code hook event and returns a decision:

| Decision | Effect |
|----------|--------|
| `allow()` | Permit the action (default) |
| `deny(message)` | Block the action. Claude sees the denial reason |
| `instruct(message)` | Don't block, but inject guidance into Claude's context |

Under the hood, policies connect to [Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks). When Claude triggers an event, Failproof AI runs your policies against it. Built-in policies run first, then custom ones. The first `deny` short-circuits; all `instruct` results accumulate.

### What policies can listen to

Policies can match any Claude Code hook event:

| Category | Events |
|----------|--------|
| **Tool execution** | `PreToolUse`, `PostToolUse`, `PostToolUseFailure` |
| **Session lifecycle** | `SessionStart`, `SessionEnd`, `Stop`, `StopFailure` |
| **User interaction** | `UserPromptSubmit`, `Notification` |
| **Subagents & tasks** | `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted` |
| **Configuration** | `InstructionsLoaded`, `ConfigChange`, `CwdChanged` |
| **File system** | `FileChanged`, `WorktreeCreate`, `WorktreeRemove` |
| **Context** | `PreCompact`, `PostCompact` |

---

## Installing policies

### Scopes

Policies can be installed at three levels. Settings merge automatically (project > local > global):

| Scope | Command | Where it writes |
|-------|---------|-----------------|
| Global (default) | `failproofai policies --install` | `~/.claude/settings.json` |
| Project | `failproofai policies --install --scope project` | `.claude/settings.json` |
| Local | `failproofai policies --install --scope local` | `.claude/settings.local.json` |

### Install specific policies

```bash
failproofai policies --install block-sudo block-rm-rf sanitize-api-keys
```

### Uninstall

```bash
failproofai policies --uninstall
# or for a specific scope:
failproofai policies --uninstall --scope project
```

---

## Custom policies

You can write your own policies in JavaScript. Enforce workflows, integrate external services, or add project-specific rules.

### Example: Block writes to production paths

```js
import { customPolicies, allow, deny } from "failproofai";

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

### Example: Send a Slack notification when Claude goes idle

```js
import { customPolicies, allow } from "failproofai";

customPolicies.add({
  name: "slack-on-idle",
  description: "Notify Slack when Claude is waiting for input",
  match: { events: ["Notification"] },
  fn: async (ctx) => {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `Claude is idle in ${ctx.session.cwd}` }),
    });
    return allow();
  },
});
```

### Example: Require a change summary before session ends

```js
import { customPolicies, allow, deny } from "failproofai";

customPolicies.add({
  name: "require-summary",
  description: "Ask Claude to summarize changes before stopping",
  match: { events: ["Stop"] },
  fn: async (ctx) => {
    const output = ctx.toolInput?.result ?? "";
    if (!output.toLowerCase().includes("summary"))
      return deny("Please provide a summary of what changed before stopping.");
    return allow();
  },
});
```

Install custom policies with:

```bash
failproofai policies --install --custom ./my-policies.js
```

### Context object (`ctx`)

| Field | Type | Description |
|-------|------|-------------|
| `eventType` | `string` | Which event fired (see events above) |
| `toolName` | `string` | Tool being called (`"Bash"`, `"Write"`, `"Read"`, ...) |
| `toolInput` | `object` | Tool's input parameters |
| `payload` | `object` | Full raw event payload |
| `session.cwd` | `string` | Working directory of the Claude Code session |
| `session.sessionId` | `string` | Session identifier |
| `session.transcriptPath` | `string` | Path to the session transcript file |

Custom policies support transitive local imports, async/await, and `process.env`. Errors are fail-open: logged to `~/.failproofai/hook.log`, built-in policies keep running. See [docs/custom-hooks.md](docs/custom-hooks.md) for more.

---

## Configuration

Policy configuration lives in `~/.failproofai/policies-config.json` (global) or `.failproofai/policies-config.json` (per-project).

```json
{
  "enabledPolicies": [
    "block-sudo",
    "block-push-master",
    "sanitize-api-keys"
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
    }
  }
}
```

Three config scopes merge automatically (project > local > global). See [docs/configuration.md](docs/configuration.md) for full merge rules.

---

## Built-in policies

35+ policies ship out of the box. Here are some highlights:

| Policy | What it does | Parameters |
|--------|-------------|:---:|
| `block-sudo` | Block sudo commands | `allowPatterns` |
| `block-rm-rf` | Block recursive deletions | `allowPaths` |
| `block-push-master` | Block pushing to protected branches | `protectedBranches` |
| `block-force-push` | Block `git push --force` | |
| `block-read-outside-cwd` | Block reads outside the project | `allowPaths` |
| `sanitize-api-keys` | Redact API keys from tool output | `additionalPatterns` |
| `sanitize-connection-strings` | Redact database credentials | |
| `warn-destructive-sql` | Warn on DROP/DELETE SQL | |
| `warn-large-file-write` | Warn on large file writes | `thresholdKb` |
| `warn-all-files-staged` | Warn on `git add -A` | |

Full list with all parameters: [docs/built-in-policies.md](docs/built-in-policies.md)

---

## Telemetry

Anonymous usage telemetry via PostHog. No session content, file names, tool inputs, or personal information is sent.

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
| [Custom Policies](docs/custom-hooks.md) | Write your own policies |
| [Dashboard](docs/dashboard.md) | Session viewer and policy management |
| [Architecture](docs/architecture.md) | How policies connect to hooks |
| [Testing](docs/testing.md) | Running tests and writing new ones |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

See [LICENSE](LICENSE).
