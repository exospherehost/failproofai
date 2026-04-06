# Built-in Policies

failproofai ships with 35+ built-in security policies. Each policy fires on a specific hook event type and tool name. Eight policies accept parameters that let you tune their behavior without writing code.

---

## Overview

Policies are grouped into categories:

| Category | Policies | Hook type |
|----------|----------|-----------|
| [Dangerous commands](#dangerous-commands) | block-sudo, block-rm-rf, block-curl-pipe-sh, block-failproofai-commands | PreToolUse |
| [Secrets (sanitizers)](#secrets-sanitizers) | sanitize-jwt, sanitize-api-keys, sanitize-connection-strings, sanitize-private-key-content, sanitize-bearer-tokens | PostToolUse |
| [Environment](#environment) | block-env-files, protect-env-vars | PreToolUse |
| [File access](#file-access) | block-read-outside-cwd, block-secrets-write | PreToolUse |
| [Git](#git) | block-push-master, block-work-on-main, block-force-push, warn-git-amend, warn-git-stash-drop, warn-all-files-staged | PreToolUse |
| [Database](#database) | warn-destructive-sql, warn-schema-alteration | PreToolUse |
| [Warnings](#warnings) | warn-large-file-write, warn-package-publish, warn-background-process, warn-global-package-install | PreToolUse |

Policies that start with `block-` return a **deny** decision (Claude cannot proceed). Policies that start with `warn-` return an **instruct** decision (Claude gets extra context but can proceed). Policies that start with `sanitize-` also return deny but fire after tool execution to redact secrets from output before Claude sees it.

---

## Dangerous commands

### `block-sudo`

**Event:** PreToolUse (Bash)  
**Default:** Denies any `sudo` command.

Blocks invocations that include the `sudo` keyword. Pattern matching is done on parsed command tokens, not the raw string, to prevent bypass via shell operator injection.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `allowPatterns` | `string[]` | `[]` | Exact command prefixes that are permitted. Each entry is matched against the parsed argv tokens. |

**Example:**

```json
{
  "policyParams": {
    "block-sudo": {
      "allowPatterns": ["sudo systemctl status", "sudo journalctl"]
    }
  }
}
```

With this config, `sudo systemctl status nginx` is allowed, but `sudo rm /etc/hosts` is denied.

> **Security note:** Patterns are matched against parsed tokens, not the raw command string. This prevents bypass via appended shell operators (e.g. `sudo systemctl status x; rm -rf /` does not match `sudo systemctl status *`).

---

### `block-rm-rf`

**Event:** PreToolUse (Bash)  
**Default:** Denies `rm -rf`, `rm -fr`, and similar recursive deletion forms.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `allowPaths` | `string[]` | `[]` | Paths that are safe to recursively delete (e.g. `/tmp`). |

**Example:**

```json
{
  "policyParams": {
    "block-rm-rf": {
      "allowPaths": ["/tmp", "/var/cache"]
    }
  }
}
```

---

### `block-curl-pipe-sh`

**Event:** PreToolUse (Bash)  
**Default:** Denies `curl <url> | bash`, `curl <url> | sh`, `wget <url> | bash`, and similar patterns.

No parameters.

---

### `block-failproofai-commands`

**Event:** PreToolUse (Bash)  
**Default:** Denies commands that would uninstall or disable failproofai itself (e.g. `npm uninstall failproofai`, `failproofai --remove-policies`).

No parameters.

---

## Secrets (sanitizers)

Sanitizer policies fire on **PostToolUse** events. When Claude runs a Bash command, reads a file, or calls any tool, these policies inspect the output before it is returned to Claude. If a secret pattern is detected, the policy returns a deny decision that prevents the output from being passed back.

### `sanitize-jwt`

**Event:** PostToolUse (all tools)  
**Default:** Redacts JWT tokens (three base64url segments separated by `.`).

No parameters.

---

### `sanitize-api-keys`

**Event:** PostToolUse (all tools)  
**Default:** Redacts common API key formats: Anthropic (`sk-ant-`), OpenAI (`sk-`), GitHub PATs (`ghp_`), AWS access keys (`AKIA`), Stripe keys (`sk_live_`, `sk_test_`), and Google API keys (`AIza`).

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `additionalPatterns` | `{ regex: string; label: string }[]` | `[]` | Additional regex patterns to treat as secrets. |

**Example:**

```json
{
  "policyParams": {
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo internal API key" },
        { "regex": "pat_[0-9a-f]{40}", "label": "Internal PAT" }
      ]
    }
  }
}
```

---

### `sanitize-connection-strings`

**Event:** PostToolUse (all tools)  
**Default:** Redacts database connection strings that contain embedded credentials (e.g. `postgresql://user:password@host/db`).

No parameters.

---

### `sanitize-private-key-content`

**Event:** PostToolUse (all tools)  
**Default:** Redacts PEM blocks (`-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`, etc.).

No parameters.

---

### `sanitize-bearer-tokens`

**Event:** PostToolUse (all tools)  
**Default:** Redacts `Authorization: Bearer <token>` headers where the token is 20 or more characters.

No parameters.

---

## Environment

### `block-env-files`

**Event:** PreToolUse (Bash, Read)  
**Default:** Denies reading `.env` files via `cat .env`, `Read` tool calls with `.env` as the file path, etc.

Does not block `.envrc` or other environment-adjacent files — only files named exactly `.env`.

No parameters.

---

### `protect-env-vars`

**Event:** PreToolUse (Bash)  
**Default:** Denies commands that print environment variables: `printenv`, `env`, `echo $VAR`.

No parameters.

---

## File access

### `block-read-outside-cwd`

**Event:** PreToolUse (Read, Bash)  
**Default:** Denies reading files outside the current working directory (the project root).

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `allowPaths` | `string[]` | `[]` | Absolute path prefixes that are permitted even if outside cwd. |

**Example:**

```json
{
  "policyParams": {
    "block-read-outside-cwd": {
      "allowPaths": ["/shared/data", "/opt/company/config"]
    }
  }
}
```

---

### `block-secrets-write`

**Event:** PreToolUse (Write, Edit)  
**Default:** Denies writes to files commonly used for private keys and certificates: `id_rsa`, `id_ed25519`, `*.key`, `*.pem`, `*.p12`, `*.pfx`.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `additionalPatterns` | `string[]` | `[]` | Additional filename patterns (glob-style) to block. |

**Example:**

```json
{
  "policyParams": {
    "block-secrets-write": {
      "additionalPatterns": [".token", ".secret"]
    }
  }
}
```

---

## Git

### `block-push-master`

**Event:** PreToolUse (Bash)  
**Default:** Denies `git push origin main` and `git push origin master`.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `protectedBranches` | `string[]` | `["main", "master"]` | Branch names that cannot be pushed to directly. |

**Example:**

```json
{
  "policyParams": {
    "block-push-master": {
      "protectedBranches": ["main", "master", "release", "prod"]
    }
  }
}
```

> To allow pushing to all branches (effectively disabling this policy without removing it from `enabledPolicies`), set `protectedBranches: []`.

---

### `block-work-on-main`

**Event:** PreToolUse (Bash)  
**Default:** Denies checking out `main` or `master` branches directly.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `protectedBranches` | `string[]` | `["main", "master"]` | Branch names that cannot be checked out directly. |

---

### `block-force-push`

**Event:** PreToolUse (Bash)  
**Default:** Denies `git push --force` and `git push -f`.

No parameters.

---

### `warn-git-amend`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to proceed carefully when running `git commit --amend`. Does not block the command.

No parameters.

---

### `warn-git-stash-drop`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to confirm before running `git stash drop`. Does not block the command.

No parameters.

---

### `warn-all-files-staged`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to review what it is staging when it runs `git add -A` or `git add .`. Does not block the command.

No parameters.

---

## Database

### `warn-destructive-sql`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to confirm before running SQL containing `DROP TABLE`, `DROP DATABASE`, or `DELETE` without a `WHERE` clause.

No parameters.

---

### `warn-schema-alteration`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to confirm before running `ALTER TABLE` statements.

No parameters.

---

## Warnings

### `warn-large-file-write`

**Event:** PreToolUse (Write)  
**Default:** Instructs Claude to confirm before writing files larger than 1024 KB.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `thresholdKb` | `number` | `1024` | File size threshold in kilobytes above which a warning is issued. |

**Example:**

```json
{
  "policyParams": {
    "warn-large-file-write": {
      "thresholdKb": 256
    }
  }
}
```

> **Note:** The hook handler enforces a 1 MB stdin limit on payloads. To test this policy with small content, set `thresholdKb` to a value well below 1024.

---

### `warn-package-publish`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to confirm before running `npm publish`.

No parameters.

---

### `warn-background-process`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to be careful when launching background processes via `nohup`, `&`, `disown`, or `screen`.

No parameters.

---

### `warn-global-package-install`

**Event:** PreToolUse (Bash)  
**Default:** Instructs Claude to confirm before running `npm install -g`, `yarn global add`, or `pip install` without a virtual environment.

No parameters.

---

## Beta policies

Some policies are marked `beta` and are not installed by default. To include them:

```bash
failproofai --install-policies --beta
```

Beta policies may have rough edges or generate false positives. Use `failproofai --list-policies` to see which policies carry the beta flag.

---

## Disabling individual policies

Remove a specific policy from `enabledPolicies` in your config, or toggle it off in the dashboard's Policies tab.

```json
{
  "enabledPolicies": [
    "block-rm-rf",
    "sanitize-api-keys"
  ]
}
```

Policies not listed in `enabledPolicies` do not run, even if `policyParams` entries exist for them.
