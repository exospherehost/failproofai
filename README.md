```
  _____     _ _                      __    _  _   _
 |  ___|_ _(_) |_ __  _ __ ___  ___ / _|  / \| | | |
 | |_ / _` | | | '_ \| '__/ _ \/ _ \ |_  / _ \ | | |
 |  _| (_| | | | |_) | | |  __/ (_) |  |/ ___ \ |_| |
 |_|  \__,_|_|_| .__/|_|  \___|\___/|_/_/   \_\___/
                |_|
```

# Failproof AI

Open-source hooks, policies, and project visualization for **Claude Code** & the **Agents SDK**.

- **Hooks & Policies** — 35+ built-in security policies that run as Claude Code hooks (PreToolUse, PostToolUse, etc.). Block dangerous commands, sanitize secrets, restrict file access, verify intent, and more. Add your own custom policies.
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
failproofai --dev
```

Opens a local dashboard at `http://localhost:8020`.

---

## Hook installation

Hooks let failproofai intercept Claude Code tool calls and evaluate policies in real time.

### Install hooks globally

```bash
failproofai --install-hooks
```

This writes hook entries into `~/.claude/settings.json` for all Claude Code sessions.

### Install hooks for a single project

```bash
failproofai --install-hooks --scope project
```

Writes into `.claude/settings.json` in the current directory.

### List installed hooks

```bash
failproofai --list-hooks
```

### Remove hooks

```bash
failproofai --remove-hooks
```

---

## Configuration

Hook configuration lives at `~/.failproofai/hooks-config.json`:

```json
{
  "enabledPolicies": [
    "sanitizeApiKeys",
    "blockReadOutsideCwd",
    "requireIntentVerification"
  ],
  "policyParams": {
    "sanitizeApiKeys": {
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
| `sanitizeApiKeys` | Redact API keys, JWTs, bearer tokens |
| `sanitizePrivateKeyContent` | Redact private key material |
| `sanitizeConnectionStrings` | Redact DB connection strings |
| `blockReadOutsideCwd` | Prevent reading files outside the project |
| `blockWriteToClaudeSettings` | Prevent modification of Claude settings |
| `requireIntentVerification` | Confirm sensitive operations with the user |
| `blockShellOperators` | Block dangerous shell operators |
| `allowlistShellCommands` | Only permit listed commands |
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
failproofai --install-hooks custom ./my-policies.js
```

---

## LLM-powered intent verification

Some policies (like `requireIntentVerification`) use an LLM to assess intent. Configure it:

```bash
failproofai --configure-llm
```

Or set environment variables:

```bash
FAILPROOFAI_LLM_API_KEY=sk-...
FAILPROOFAI_LLM_BASE_URL=https://api.openai.com/v1
FAILPROOFAI_LLM_MODEL=gpt-4o-mini
```

---

## Telemetry

Failproof AI collects anonymous usage telemetry via PostHog to understand feature usage. No session content, file names, or personal information is ever sent.

Disable it:

```bash
FAILPROOFAI_TELEMETRY_DISABLED=1 failproofai --dev
```

---

## License

See [LICENSE](LICENSE).
