# Contributing to Failproof AI

Thanks for your interest in contributing! Here's how to get started.

## Prerequisites

- Bun >= 1.3.0 (or Node.js >= 20.9.0)

## Development Setup

```bash
git clone https://github.com/exosphereHost/failproofai.git
cd failproofai
bun install
bun run dev
```

The dev server starts at `http://localhost:8020`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start the development server |
| `bun run lint` | Run ESLint |
| `bunx tsc --noEmit` | Type-check without emitting |
| `bun run test:run` | Run tests once (Vitest) |
| `bun run test` | Run tests in watch mode |
| `bun run build` | Production build (Next.js) |

## Project Structure

```
failproofai/
├── app/            # Next.js app router (pages, layouts, server actions)
├── bin/            # CLI entry point
├── components/     # Shared React components
├── contexts/       # React context providers
├── lib/            # Core logic (logging, telemetry, paths, URL utils)
├── src/hooks/      # Hook handler, built-in policies, custom hooks loader
├── scripts/        # Dev/start/build helper scripts
├── __tests__/      # Test files
├── examples/       # Example custom hook policies
└── public/         # Static assets
```

### Key Subsystems

| Directory | Description |
|-----------|-------------|
| `src/hooks/` | Hook handler, built-in policies, custom hooks loader |
| `app/actions/` | Next.js server actions |
| `app/components/` | Session viewer, project list, log viewer |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_PROJECTS_PATH` | Path to Claude projects directory |
| `FAILPROOFAI_LOG_LEVEL` | Log level: `info`, `warn`, `error` (default: `warn`) |
| `FAILPROOFAI_TELEMETRY_DISABLED` | Set to `1` to disable anonymous telemetry |
| `FAILPROOFAI_DISABLE_PAGES` | Comma-separated pages to disable: `policies`, `projects` |

## Pull Request Guidelines

1. Keep changes focused — one concern per PR.
2. Make sure all checks pass before requesting review:
   ```bash
   bun run lint && bunx tsc --noEmit && bun run test:run && bun run build
   ```
3. Include a clear description of what the PR does and why.
4. Add tests for new functionality when applicable.

## Reporting Issues

Found a bug or have a feature idea? [Open an issue](https://github.com/exosphereHost/failproofai/issues). The issue templates will guide you through providing the right details.
