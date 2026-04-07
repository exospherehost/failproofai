---
title: Configuration
description: "Config file format, three-scope system, and merge rules"
icon: gear
---

failproofai uses JSON configuration files to control which policies are active, how they behave, and where custom hooks are loaded from.

---

## Configuration scopes

There are three configuration scopes, evaluated in priority order:

| Scope | File path | Purpose |
|-------|-----------|---------|
| **project** | `.failproofai/policies-config.json` | Per-repo settings, committed to version control |
| **local** | `.failproofai/policies-config.local.json` | Personal per-repo overrides, gitignored |
| **global** | `~/.failproofai/policies-config.json` | User-level defaults across all projects |

When failproofai receives a hook event, it loads and merges all three files that exist for the current working directory.

### Merge rules

**`enabledPolicies`** — the union of all three scopes. A policy enabled at any level is active.

```
project:  ["block-sudo"]
local:    ["block-rm-rf"]
global:   ["block-sudo", "sanitize-api-keys"]

resolved: ["block-sudo", "block-rm-rf", "sanitize-api-keys"]  ← deduplicated union
```

**`policyParams`** — first scope that defines params for a given policy wins entirely. There is no deep merging of values within a policy's params.

```
project:  block-sudo → { allowPatterns: ["sudo apt-get update"] }
global:   block-sudo → { allowPatterns: ["sudo systemctl status"] }

resolved: { allowPatterns: ["sudo apt-get update"] }   ← project wins, global ignored
```

```
project:  (no block-sudo entry)
local:    (no block-sudo entry)
global:   block-sudo → { allowPatterns: ["sudo systemctl status"] }

resolved: { allowPatterns: ["sudo systemctl status"] }  ← falls through to global
```

**`customPoliciesPath`** — first scope that defines it wins.

**`llm`** — first scope that defines it wins.

---

## Config file format

```json
{
  "enabledPolicies": [
    "block-sudo",
    "block-rm-rf",
    "block-push-master",
    "sanitize-api-keys",
    "sanitize-jwt",
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
    "block-rm-rf": {
      "allowPaths": ["/tmp"]
    },
    "block-read-outside-cwd": {
      "allowPaths": ["/shared/data", "/opt/company"]
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo API key" }
      ]
    },
    "warn-large-file-write": {
      "thresholdKb": 512
    }
  },
  "customPoliciesPath": "/home/alice/myproject/my-policies.js"
}
```

---

## Field reference

### `enabledPolicies`

Type: `string[]`

List of policy names to enable. Names must match exactly the policy identifiers shown in `failproofai --list-policies`. See [Built-in Policies](./built-in-policies.md) for the full list.

Policies not in `enabledPolicies` are inactive, even if they have entries in `policyParams`.

### `policyParams`

Type: `Record<string, Record<string, unknown>>`

Per-policy parameter overrides. The outer key is the policy name; the inner keys are policy-specific. Each policy documents its available parameters in [Built-in Policies](./built-in-policies.md).

If a policy has parameters but you don't specify them, the policy's built-in defaults are used. Users who do not configure `policyParams` at all get identical behavior to previous versions.

Unknown keys inside a policy's params block are silently ignored at hook-fire time but flagged as warnings when you run `failproofai --list-policies`.

### `customPoliciesPath`

Type: `string` (absolute path)

Path to a JavaScript file containing custom hook policies. This is set automatically by `failproofai --install-policies --custom <path>` (the path is resolved to absolute before being stored).

The file is loaded fresh on every hook event — there is no caching. See [Custom Hooks](./custom-hooks.md) for authoring details.

### `llm`

Type: `object` (optional)

LLM client configuration for policies that make AI calls. Not required for most setups.

```json
{
  "llm": {
    "model": "claude-sonnet-4-6",
    "apiKey": "sk-ant-..."
  }
}
```

---

## Managing configuration from the CLI

The `--install-policies` and `--remove-policies` commands write to Claude Code's `settings.json` (the hook entry points), while `policies-config.json` is the file you manage directly. The two are separate:

- **`settings.json`** — tells Claude Code to call `failproofai --hook <event>` on each tool use
- **`policies-config.json`** — tells failproofai which policies to evaluate and with what params

You can edit `policies-config.json` directly at any time; changes take effect immediately on the next hook event with no restart needed.

---

## Example: project-level config with team defaults

Commit `.failproofai/policies-config.json` to your repo:

```json
{
  "enabledPolicies": [
    "block-sudo",
    "block-rm-rf",
    "block-push-master",
    "sanitize-api-keys",
    "block-env-files"
  ],
  "policyParams": {
    "block-push-master": {
      "protectedBranches": ["main", "release", "hotfix"]
    }
  }
}
```

Each developer can then create `.failproofai/policies-config.local.json` (gitignored) for personal overrides without affecting teammates.
