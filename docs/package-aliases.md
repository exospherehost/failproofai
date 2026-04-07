# Package Aliases & Typosquatting Protection

## Official package

The canonical npm package is **`failproofai`**:

```bash
npm install -g failproofai
```

---

## Why we own the alias names

Typosquatting is a common supply-chain attack where a malicious actor registers a package name that is one keystroke away from a popular package. Unsuspecting users who mistype the install command end up running attacker-controlled code with full system access — exactly the kind of threat Failproof AI is designed to defend against.

To eliminate this surface, **we pre-emptively own all common misspellings and formatting variants** of `failproofai` on npm. None of these names can be registered by a third party. Each one is a thin proxy that installs and delegates to the real `failproofai` package.

---

## Registered aliases

**Formatting variants** — different ways to write "failproof ai":

| Package | Install command |
|---------|----------------|
| `failproof` | `npm install -g failproof` |
| `failproof-ai` | `npm install -g failproof-ai` |
| `fail-proof-ai` | `npm install -g fail-proof-ai` |
| `failproof_ai` | `npm install -g failproof_ai` |
| `fail_proof_ai` | `npm install -g fail_proof_ai` |
| `fail-proofai` | `npm install -g fail-proofai` |

**`failprof*` typos** — missing one `o` from "proof":

| Package | Install command |
|---------|----------------|
| `failprof` | `npm install -g failprof` |
| `failprof-ai` | `npm install -g failprof-ai` |
| `failprofai` | `npm install -g failprofai` |
| `fail-prof-ai` | `npm install -g fail-prof-ai` |
| `failprof_ai` | `npm install -g failprof_ai` |

**`faliproof*` typos** — transposed `a` and `i`:

| Package | Install command |
|---------|----------------|
| `faliproof` | `npm install -g faliproof` |
| `faliproof-ai` | `npm install -g faliproof-ai` |
| `faliproofai` | `npm install -g faliproofai` |

All 14 aliases are published by **ExosphereHost Inc.** (the same npm account as `failproofai`). You can verify any of them:

```bash
npm info failproof-ai
# Look for: "ExosphereHost Inc." in the maintainers field
```

---

## How the aliases work

Each alias package:

1. Lists `failproofai` as a dependency — so the real package (including its `postinstall` hook setup) runs on install
2. Exposes a binary matching its own name (e.g. `failproof-ai`) that proxies all arguments to the `failproofai` binary

The proxy is a two-line Node script; there is no logic, no network calls, and no data collection beyond what `failproofai` itself does.

---

## If you find a name we missed

Open an issue at [exospherehost/failproofai](https://github.com/exospherehost/failproofai/issues) and we will register it.
