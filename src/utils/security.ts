import { realpath, stat } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const BLOCKED_PREFIXES = [
  "/etc",
  "/proc",
  "/sys",
  "/dev",
  "c:/windows",
  "c:/program files",
  "c:/program files (x86)",
].map((p) => p.replace(/\\/g, "/").toLowerCase());

const SENSITIVE_PATH_MARKERS = [
  "/.ssh",
  "/.aws",
  "/.gnupg",
  "/.kube",
  "/credentials",
  "/.npmrc",
  "/.netrc",
  "/appdata/roaming/microsoft/usersecrets",
  "/library/keychains",
];

export interface SafeRepoPathOptions {
  allowAbsolute?: boolean;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

function isBlockedSystemPath(normalized: string): boolean {
  for (const blocked of BLOCKED_PREFIXES) {
    if (normalized === blocked || normalized.startsWith(`${blocked}/`)) {
      return true;
    }
  }
  return false;
}

function isSensitivePath(normalized: string): boolean {
  for (const marker of SENSITIVE_PATH_MARKERS) {
    if (normalized.includes(marker)) return true;
  }
  return false;
}

function isWithinRoot(resolvedPath: string, resolvedRoot: string): boolean {
  const pathNorm = resolvedPath.replace(/\\/g, "/");
  const rootNorm = resolvedRoot.replace(/\\/g, "/");
  const prefix = rootNorm.endsWith("/") ? rootNorm : `${rootNorm}/`;
  return pathNorm === rootNorm || pathNorm.startsWith(prefix);
}

/**
 * Resolves and validates a repository path for local scanning.
 */
export async function assertSafeRepoPath(
  inputPath?: string,
  options: SafeRepoPathOptions = {},
): Promise<string> {
  const cwd = process.cwd();
  const raw = inputPath ?? ".";
  const target = isAbsolute(raw) ? resolve(raw) : resolve(cwd, raw);

  if (isAbsolute(raw) && !options.allowAbsolute) {
    throw new Error(
      "Absolute paths require --allow-absolute (only use on directories you trust)",
    );
  }

  let resolvedTarget: string;
  try {
    const st = await stat(target);
    if (!st.isDirectory()) {
      throw new Error(`Not a directory: ${target}`);
    }
    resolvedTarget = await realpath(target);
  } catch {
    throw new Error(`Repository path does not exist: ${target}`);
  }

  const normalized = normalizePath(resolvedTarget);
  if (isBlockedSystemPath(normalized)) {
    throw new Error("Scanning this system path is not allowed");
  }
  if (isSensitivePath(normalized)) {
    throw new Error("Scanning sensitive credential paths is not allowed");
  }

  if (!isAbsolute(raw)) {
    const resolvedCwd = await realpath(cwd);
    if (!isWithinRoot(resolvedTarget, resolvedCwd)) {
      throw new Error("Relative path escapes the current working directory");
    }
  }

  return resolvedTarget;
}

/**
 * Ensures a relative output path resolves inside the repository (prevents write traversal).
 */
export async function assertPathWithinRepo(
  repoRoot: string,
  relativePath: string,
): Promise<string> {
  if (relativePath.includes("\0")) {
    throw new Error("Invalid path");
  }
  if (isAbsolute(relativePath)) {
    throw new Error("Output path must be relative to the repository root");
  }

  const normalizedRel = relativePath.replace(/\\/g, "/");
  if (
    normalizedRel.startsWith("../") ||
    normalizedRel.includes("/../") ||
    normalizedRel === ".."
  ) {
    throw new Error("Output path must not contain parent directory segments");
  }

  const resolvedRepo = await realpath(repoRoot);
  const candidate = resolve(resolvedRepo, relativePath);

  if (!isWithinRoot(candidate, resolvedRepo)) {
    throw new Error("Output path must stay within the repository");
  }

  return candidate;
}

export function escapeMermaidLabel(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "'")
    .replace(/[\r\n]/g, " ")
    .replace(/[[\]]/g, "");
}

export function escapeMarkdownCell(value: string): string {
  return value.replace(/[|\r\n]/g, " ").trim();
}

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "OpenAI API key", pattern: /sk-[a-zA-Z0-9]{20,}/ },
  { name: "GitHub PAT", pattern: /ghp_[a-zA-Z0-9]{20,}/ },
  { name: "GitHub fine-grained PAT", pattern: /github_pat_[a-zA-Z0-9_]{20,}/ },
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "Bearer token", pattern: /Bearer\s+[a-zA-Z0-9._-]{20,}/i },
  { name: "Private key block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

export function detectSecretsInText(text: string): string[] {
  const found: string[] = [];
  for (const { name, pattern } of SECRET_PATTERNS) {
    if (pattern.test(text)) found.push(name);
  }
  return found;
}

export function redactSecrets(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-[REDACTED]")
    .replace(/ghp_[a-zA-Z0-9]{20,}/g, "ghp_[REDACTED]")
    .replace(/github_pat_[a-zA-Z0-9_]{20,}/g, "github_pat_[REDACTED]")
    .replace(/AKIA[0-9A-Z]{16}/g, "AKIA[REDACTED]")
    .replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/gi, "Bearer [REDACTED]")
    .replace(
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
      "[PRIVATE KEY REDACTED]",
    );
}

export { isWithinRoot };
