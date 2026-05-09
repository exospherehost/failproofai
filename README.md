<div align="center">

<img src="https://d2wq11aau0arks.cloudfront.net/failproof/logo-wordmark.png" alt="failproof ai" width="220" />

[![npm](https://img.shields.io/npm/v/failproofai?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![npm downloads](https://img.shields.io/npm/dw/failproofai?style=flat-square&color=CB3837)](https://www.npmjs.com/package/failproofai)
[![CI](https://img.shields.io/github/actions/workflow/status/exospherehost/failproofai/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/exospherehost/failproofai/actions)
[![Slack](https://img.shields.io/badge/Slack-join%20us-4A154B?style=flat-square&logo=slack)](https://join.slack.com/t/failproofai/shared_invite/zt-3v63b7k5e-O3NBHmj8X6n9gZSGDx6ggQ)
[![Docs](https://img.shields.io/badge/docs-befailproof.ai-002CA7?style=flat-square)](https://docs.befailproof.ai)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause-blue?style=flat-square)](./LICENSE)

**Runtime failure resolution for coding agents.**
Hooks into Claude Code and Codex. Catches loops, dangerous actions, and secret leaks
before they become incidents. Zero latency. Runs locally.

</div>

<p align="center">
  <img src="readme-arch-hq.gif" alt="Failproof AI in action" width="800" />
</p>

---

## Install

```sh
npm install -g failproofai
failproofai policies --install
failproofai
```

30 built-in policies activate immediately. Dashboard at `localhost:8020`.

---

## What it stops

| Policy | What it blocks |
|---|---|
| `block-push-master` | Direct pushes to main/master |
| `block-rm-rf` | Recursive file deletion |
| `sanitize-api-keys` | API keys leaking into agent context |
| `block-read-outside-cwd` | Agent reading outside project root |
| `block-env-files` | Agent reading .env files |
| `warn-destructive-sql` | DROP / DELETE before execution |

→ [All 30 built-in policies](https://docs.befailproof.ai/built-in-policies)

---

## Your own policies

Drop a file into `.failproofai/policies/` — it loads automatically, no flags needed.
Commit it and the whole team gets it on next pull.

```js
import { customPolicies, deny, allow } from "failproofai";

customPolicies.add({
  name: "no-production-writes",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolInput?.file_path?.includes("production"))
      return deny("Writes to production paths are blocked.");
    return allow();
  },
});
```

Three decisions available to every policy:

| Decision | Effect |
|---|---|
| `allow()` | Permit the operation |
| `deny(message)` | Block it — message goes back to the agent |
| `instruct(message)` | Let it through, but add context to the agent's next prompt |

→ [Custom policies guide](https://docs.befailproof.ai/custom-policies)

---

## Session visibility

Every tool call your agent makes is logged locally. The dashboard shows what ran,
what was blocked, and what the policy told the agent — so you're not guessing
when something goes wrong. → [Dashboard guide](https://docs.befailproof.ai/dashboard)

---

## Documentation

| | |
|---|---|
| [Getting Started](https://docs.befailproof.ai/getting-started) | Installation and first steps |
| [Built-in Policies](https://docs.befailproof.ai/built-in-policies) | All 30 policies with parameters |
| [Custom Policies](https://docs.befailproof.ai/custom-policies) | Write your own |
| [Configuration](https://docs.befailproof.ai/configuration) | Config scopes and merge rules |
| [Dashboard](https://docs.befailproof.ai/dashboard) | Session monitor and policy activity |
| [Architecture](https://docs.befailproof.ai/architecture) | How the hook system works |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). New policies, edge cases, and translations all welcome.

---

**Translations:**
[简体中文](./docs/i18n/README.zh.md) · [日本語](./docs/i18n/README.ja.md) · [한국어](./docs/i18n/README.ko.md) · [Español](./docs/i18n/README.es.md) · [Português](./docs/i18n/README.pt-br.md) · [Deutsch](./docs/i18n/README.de.md) · [Français](./docs/i18n/README.fr.md) · [Русский](./docs/i18n/README.ru.md) · [हिन्दी](./docs/i18n/README.hi.md) · [Türkçe](./docs/i18n/README.tr.md) · [Tiếng Việt](./docs/i18n/README.vi.md) · [Italiano](./docs/i18n/README.it.md) · [العربية](./docs/i18n/README.ar.md) · [עברית](./docs/i18n/README.he.md)

---

Built by [Nivedit Jain](https://github.com/NiveditJain) and [Nikita Agarwal](https://github.com/nk-ag).
[befailproof.ai](https://befailproof.ai)
