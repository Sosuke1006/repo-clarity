# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Do not** open public issues for security vulnerabilities.

1. Use [GitHub Private Vulnerability Reporting](https://github.com/Sosuke1006/repo-clarity/security/advisories/new) if enabled, or
2. Open a private security advisory via the repository **Security** tab.

We aim to acknowledge reports within 72 hours.

## Threat Model

`repo-clarity` runs **locally** on your machine:

- Relative scan paths cannot escape the current working directory.
- Absolute scan paths require `--allow-absolute` and still block credential directories.
- Generated files cannot be written outside the repository root.
- Directory walks skip symbolic links and stay within the resolved repository root.
- System paths (e.g. `C:\Windows`, `/etc`) are blocked.
- Individual files larger than 512 KiB are skipped when reading text.
- `refine readme` requires `--i-understand-llm-risk` and scans payloads for secret patterns before LLM calls.
- Remote `OLLAMA_HOST` is blocked unless `REPO_CLARITY_ALLOW_REMOTE_OLLAMA=1`.
- API keys must be supplied via environment variables — never commit them.

## Dependency Security

- `npm audit` runs in CI on every push and PR.
- Dependabot opens weekly update PRs for npm dependencies.

## Safe Usage

```bash
# Prefer scanning project directories explicitly
repo-clarity scan .

# LLM keys via env only
export REPO_CLARITY_OPENAI_API_KEY="..."
repo-clarity refine readme --dry-run
```
