```
    ______      _ __                       ____   ___    ____
   / ____/___ _(_) /___  _________  ____  / __/  /   |  /  _/
  / /_  / __ `/ / / __ \/ ___/ __ \/ __ \/ /_   / /| |  / /
 / __/ / /_/ / / / /_/ / /  / /_/ / /_/ / __/  / ___ |_/ /
/_/    \__,_/_/_/ .___/_/   \____/\____/_/    /_/  |_/___/
               /_/
```

# Failproof AI

Open-source hooks, policies, and project visualization for **Claude Code** & the **Agents SDK**.

- **Hooks & Policies** — 35+ built-in security policies that run as Claude Code hooks (PreToolUse, PostToolUse, etc.). Block dangerous commands, sanitize secrets, restrict file access, and more. Add your own custom policies.
- **Projects** — Browse your Claude Code projects and sessions locally. Search, filter, and inspect session logs.
- **Session Viewer** — Read tool calls, messages, and per-session hook activity side-by-side.

Everything runs locally — no data leaves your machine.

---

## Requirements

- Bun >= 1.3.0
- Node.js >= 20.9.0

---

## Install

```bash
npm install -g failproofai
```

## Run the dashboard

```bash
failproofai
```

Opens a local dashboard at `http://localhost:8020`.

---

## Policy installation

Policies let failproofai intercept Claude Code tool calls and evaluate rules in real time.

### Install policies globally

```bash
failproofai --install-policies
```

This writes hook entries into `~/.claude/settings.json` for all Claude Code sessions.

### Install policies for a single project

```bash
failproofai --install-policies --scope project
```

Writes into `.claude/settings.json` in the current directory.

### List installed policies

```bash
failproofai --list-policies
```

### Remove policies

```bash
failproofai --remove-policies
```

---

## Configuration

Policy configuration lives at `~/.failproofai/hooks-config.json`:

```json
{
  "enabledPolicies": [
    "sanitize-api-keys",
    "block-read-outside-cwd",
    "block-sudo"
  ],
  "policyParams": {
    "sanitize-api-keys": {
      "additionalPatterns": ["MY_SECRET_[A-Z0-9]+"]
    }
  }
}
```

You can also set configuration per-project in `.claude/settings.json` under a `failproofai` key.

---

## Built-in policies

| Policy | Description |
|---|---|
| `sanitize-api-keys` | Redact API keys, bearer tokens |
| `sanitize-private-key-content` | Redact private key material |
| `sanitize-connection-strings` | Redact DB connection strings |
| `block-read-outside-cwd` | Prevent reading files outside the project |
| `block-env-files` | Block access to .env files |
| `block-sudo` | Block sudo commands |
| `block-rm-rf` | Block destructive recursive deletions |
| `block-failproofai-commands` | Prevent self-uninstallation |
| … and 25+ more | |

---

## Custom policies

Create a `.js` file with your custom policies:

```js
import { customPolicies, allow, deny } from "failproofai";

customPolicies.add({
  name: "no-curl-external",
  description: "Block curl to external hosts",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = ctx.toolInput?.command ?? "";
    if (/curl\s+https?:\/\/(?!localhost)/.test(cmd)) {
      return deny("External curl requests are blocked");
    }
    return allow();
  },
});
```

Install with:

```bash
failproofai --install-policies --custom-hooks ./my-policies.js
```

---

## Telemetry

Failproof AI collects anonymous usage telemetry via PostHog to understand feature usage. No session content, file names, or personal information is ever sent.

Disable it:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai
```

---

## License

See [LICENSE](LICENSE).
