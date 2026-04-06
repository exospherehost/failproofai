# Failproof AI — Documentation

Open-source hooks, policies, and session visualization for **Claude Code** and the **Agents SDK**. Runs entirely locally — no data leaves your machine.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | Install failproofai, enable policies, and take it for a spin |
| [CLI Reference](./cli-reference.md) | All commands, flags, and environment variables |
| [Configuration](./configuration.md) | Config file format, three-scope system, and merge rules |
| [Built-in Policies](./built-in-policies.md) | All 35+ policies with descriptions and parameters |
| [Custom Hooks](./custom-hooks.md) | Write your own policies in JavaScript |
| [Dashboard](./dashboard.md) | Session viewer, policy management, and activity log |
| [Architecture](./architecture.md) | How the hook handler, config loading, and policy evaluation work |
| [Testing](./testing.md) | Unit tests, E2E tests, and test helpers |

---

## Quick reference

**Install:**
```bash
npm install -g failproofai
```

**Enable policies globally:**
```bash
failproofai --install-policies
```

**Launch dashboard:**
```bash
failproofai
```

**List active policies:**
```bash
failproofai --list-policies
```

**Add a custom policy file:**
```bash
failproofai --install-policies --custom-hooks ./my-policies.js
```
