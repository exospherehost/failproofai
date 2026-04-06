# Getting Started

## Requirements

- **Node.js** >= 20.9.0
- **Bun** >= 1.3.0 (used as the runtime and bundler)

---

## Installation

```bash
npm install -g failproofai
```

---

## Quick Start

### 1. Launch the dashboard

```bash
failproofai
```

Opens a local web dashboard at `http://localhost:8020`. The dashboard lets you browse your Claude Code projects and sessions, inspect session logs and tool calls, and manage policies.

### 2. Install policies

Policies are the security rules that Claude Code enforces when it runs tools. Installing them writes hook entries into Claude Code's `settings.json`.

**Install globally** (applies to all Claude Code sessions):

```bash
failproofai --install-policies
```

**Install for the current project only:**

```bash
failproofai --install-policies --scope project
```

**Install specific policies by name:**

```bash
failproofai --install-policies block-sudo block-rm-rf sanitize-api-keys
```

See [Built-in Policies](./built-in-policies.md) for the full list.

### 3. Verify installation

```bash
failproofai --list-policies
```

This shows every policy, whether it is enabled, and any configured parameters.

### 4. Try it out

Once policies are installed, run Claude Code as normal. When Claude attempts a blocked action (e.g. `sudo`, `rm -rf`, or outputting an API key), failproofai intercepts and blocks it automatically.

---

## How policies work

When Claude Code is about to run a tool (a `PreToolUse` event), or has just run one (a `PostToolUse` event), it invokes failproofai as a subprocess:

```
Claude Code  →  failproofai --hook PreToolUse  →  stdin: JSON payload
                                                  stdout: decision JSON
                                                  exit code: 0 (allow/instruct) or 2 (deny on Stop)
```

failproofai reads the tool name and input, evaluates all enabled policies, and returns a decision:

- **allow** — Claude proceeds normally (empty stdout)
- **deny** — Claude is told the action is blocked and why
- **instruct** — Claude gets extra context/instructions added to its prompt

Policies run entirely in your local process. Nothing is sent to a remote service.

---

## Data storage

failproofai stores all configuration and logs locally:

| Path | Contents |
|------|----------|
| `~/.failproofai/hooks-config.json` | Global policy configuration |
| `~/.failproofai/hook-activity.jsonl` | Hook execution history (one JSON line per event) |
| `~/.failproofai/hook.log` | Debug log for custom hook errors |
| `.failproofai/hooks-config.json` | Per-project policy configuration (committed) |
| `.failproofai/hooks-config.local.json` | Per-project personal overrides (gitignored) |

---

## Uninstalling

```bash
failproofai --remove-policies
```

Removes the hook entries from `~/.claude/settings.json`. The failproofai configuration files in `~/.failproofai/` are left in place.

To remove for a specific scope:

```bash
failproofai --remove-policies --scope project
```

---

## Next steps

- [Configuration](./configuration.md) — understand scopes and the config file format
- [Built-in Policies](./built-in-policies.md) — full list of policies and their parameters
- [Custom Hooks](./custom-hooks.md) — write your own policies in JavaScript
- [Dashboard](./dashboard.md) — using the session viewer and policy manager
- [CLI Reference](./cli-reference.md) — all flags and commands
