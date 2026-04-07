---
title: Introduction
description: "Open-source hooks, policies, and session visualization for Claude Code and the Agents SDK"
---

Open-source hooks, policies, and session visualization for **Claude Code** and the **Agents SDK**. Runs entirely locally — no data leaves your machine.

## What is Failproof AI?

Failproof AI is a security and observability toolkit that intercepts Claude Code tool calls in real time. It evaluates configurable policies — blocking dangerous commands, redacting secrets, and adding safety instructions — before Claude can act.

It also includes a local web dashboard for browsing Claude Code sessions, inspecting tool calls, and managing policies visually.

## Key features

<CardGroup cols={2}>
  <Card title="35+ Built-in Policies" icon="shield" href="/built-in-policies">
    Block sudo, rm -rf, force-push, secret leaks, and more — out of the box.
  </Card>
  <Card title="Custom Hooks" icon="code" href="/custom-hooks">
    Write your own policies in JavaScript with a simple allow/deny/instruct API.
  </Card>
  <Card title="Session Dashboard" icon="chart-line" href="/dashboard">
    Browse projects, inspect sessions, and review every tool call and policy decision.
  </Card>
  <Card title="Three-Scope Config" icon="gear" href="/configuration">
    Global, project, and local configuration with automatic merging.
  </Card>
</CardGroup>

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

<Card title="Getting Started Guide" icon="rocket" href="/getting-started">
  Full walkthrough: install, enable policies, and take it for a spin.
</Card>
