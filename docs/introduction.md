---
title: Introduction
description: "Open-source hooks, policies, and session visualization for Claude Code and the Agents SDK"
---

# Failproof AI

Open-source hooks, policies, and session visualization for **Claude Code** and the **Agents SDK**. Runs entirely locally — no data leaves your machine.

## What is Failproof AI?

Failproof AI is a security and observability toolkit that intercepts Claude Code tool calls in real time. It evaluates configurable policies — blocking dangerous commands, redacting secrets, and adding safety instructions — before Claude can act.

It also includes a local web dashboard for browsing Claude Code sessions, inspecting tool calls, and managing policies visually.

## Key features

| Feature | Description |
|---------|-------------|
| [35+ Built-in Policies](./built-in-policies.md) | Block sudo, rm -rf, force-push, secret leaks, and more — out of the box. |
| [Custom Hooks](./custom-hooks.md) | Write your own policies in JavaScript with a simple allow/deny/instruct API. |
| [Session Dashboard](./dashboard.md) | Browse projects, inspect sessions, and review every tool call and policy decision. |
| [Three-Scope Config](./configuration.md) | Global, project, and local configuration with automatic merging. |

## Quick start

Install globally via npm:

```bash
npm install -g failproofai
```

Enable policies:

```bash
failproofai --install-policies
```

Launch the dashboard:

```bash
failproofai
```

See the [Getting Started](./getting-started.md) guide for a full walkthrough.
