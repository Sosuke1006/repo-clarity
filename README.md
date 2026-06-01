# repo-clarity

**Analyze any GitHub repository and generate or improve OSS documentation** — README, CONTRIBUTING, issue templates, architecture docs, and PR checks.

[![CI](https://github.com/Sosuke1006/repo-clarity/actions/workflows/ci.yml/badge.svg)](https://github.com/Sosuke1006/repo-clarity/actions/workflows/ci.yml)
[![Security](https://github.com/Sosuke1006/repo-clarity/actions/workflows/security.yml/badge.svg)](https://github.com/Sosuke1006/repo-clarity/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm public](https://img.shields.io/npm/v/repo-clarity?label=npm)](https://www.npmjs.com/package/repo-clarity)

## Why repo-clarity?

Open-source projects live or die on clarity. `repo-clarity` scans your repo **locally** (no network required for core features) and helps you:

- Understand languages, tests, CI, and layout
- Diagnose missing OSS files (LICENSE, CONTRIBUTING, templates)
- Scaffold documentation from your actual project structure
- Generate architecture docs with dependency graphs
- Optionally refine READMEs via OpenAI or Ollama
- Automate OSS checks on pull requests (GitHub Action)

## Install

```bash
npm install -g repo-clarity
```

Or run without installing:

```bash
npx repo-clarity scan
```

## Quick start

```bash
repo-clarity scan
repo-clarity doctor
repo-clarity summary

repo-clarity generate readme
repo-clarity generate contributing
repo-clarity generate issue-templates
repo-clarity generate architecture

# Optional LLM refinement (requires API key or local Ollama)
export REPO_CLARITY_OPENAI_API_KEY="your-key"
repo-clarity refine readme --dry-run
repo-clarity refine readme --force
```

## Commands

| Command | Description |
| -------- | ----------- |
| `scan [path]` | Languages, package managers, tests, CI, entry points |
| `doctor [path]` | OSS hygiene score; exit code 1 if critical issues |
| `summary [path]` | Architecture overview and dev commands |
| `generate readme` | Create `README.md` (`--force`, `--dry-run`) |
| `generate contributing` | Create `CONTRIBUTING.md` |
| `generate issue-templates` | GitHub bug + feature templates |
| `generate architecture` | `docs/ARCHITECTURE.md` with dependency table + Mermaid |
| `refine readme` | LLM polish (`--provider openai\|ollama`, `--model`) |

## GitHub Action (PR comments)

This repository runs **repo-clarity doctor** on every pull request and posts the result as a comment.

Use in your own repo:

```yaml
name: OSS check
on:
  pull_request:
jobs:
  clarity:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: Sosuke1006/repo-clarity@v0.1.0
        with:
          path: .
          comment-on-pr: "true"
```

Or run the built-in workflow pattern from [.github/workflows/repo-clarity-pr.yml](.github/workflows/repo-clarity-pr.yml).

## Security

- Path traversal protection for relative paths
- Blocked system directory scans
- 512 KiB read limit per file
- `npm audit` in CI; Dependabot enabled
- See [SECURITY.md](SECURITY.md) for reporting vulnerabilities

**Never commit API keys.** Copy [.env.example](.env.example) and use `REPO_CLARITY_OPENAI_API_KEY`.

## Publishing (maintainers)

This package is configured for **public** npm (`publishConfig.access: public`).

```bash
npm run build
npm test
npm publish --access public
```

Create a **public** GitHub repository and push:

```bash
git remote add origin https://github.com/Sosuke1006/repo-clarity.git
git branch -M main
git push -u origin main
```

Enable **Private vulnerability reporting** under GitHub → Settings → Security.

## Development

```bash
git clone https://github.com/Sosuke1006/repo-clarity.git
cd repo-clarity
npm install
npm run build
npm test
npm run dev -- scan ./tests/fixtures/node-lib
```

## Example output

See [examples/sample-output/](examples/sample-output/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
