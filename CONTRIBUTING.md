# Contributing to repo-clarity

Thanks for helping improve OSS documentation tooling!

## Setup

```bash
npm install
npm run build
npm test
```

## Workflow

1. Fork and clone the repo
2. Create a branch: `git checkout -b feat/your-change`
3. Make changes with tests when applicable
4. Run `npm run lint` and `npm test`
5. Open a pull request with a clear description

## Project layout

- `src/commands/` — CLI command handlers
- `src/core/` — scanning, doctor, summarizer, dependency graph, optional LLM
- `tests/fixtures/` — sample repos for integration tests
- `.github/workflows/` — CI, security audit, PR doctor comments
- `action.yml` — reusable GitHub Action for other repositories

## Code style

- TypeScript strict mode
- Prefer small, focused modules
- Match existing naming and patterns

## Reporting issues

Use the GitHub issue templates for bugs and feature requests.
