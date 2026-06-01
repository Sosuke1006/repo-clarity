import { realpath, stat } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const BLOCKED_PREFIXES = [
  "/etc",
  "/proc",
  "/sys",
  "/dev",
  "C:\\Windows",
  "C:\\Program Files",
].map((p) => p.replace(/\\/g, "/").toLowerCase());

/**
 * Resolves and validates a repository path for local scanning.
 * Relative paths must stay within cwd; absolute paths are allowed except blocked system dirs.
 */
export async function assertSafeRepoPath(inputPath?: string): Promise<string> {
  const cwd = process.cwd();
  const raw = inputPath ?? ".";
  const target = isAbsolute(raw) ? resolve(raw) : resolve(cwd, raw);

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

  const normalized = resolvedTarget.replace(/\\/g, "/").toLowerCase();
  for (const blocked of BLOCKED_PREFIXES) {
    if (normalized === blocked || normalized.startsWith(`${blocked}/`)) {
      throw new Error("Scanning this system path is not allowed");
    }
  }

  if (!isAbsolute(raw)) {
    const resolvedCwd = await realpath(cwd);
    const cwdPrefix = `${resolvedCwd.replace(/\\/g, "/")}/`;
    const targetNorm = resolvedTarget.replace(/\\/g, "/");
    const cwdNorm = resolvedCwd.replace(/\\/g, "/");
    if (targetNorm !== cwdNorm && !targetNorm.startsWith(cwdPrefix)) {
      throw new Error("Relative path escapes the current working directory");
    }
  }

  return resolvedTarget;
}

export function redactSecrets(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-[REDACTED]")
    .replace(/ghp_[a-zA-Z0-9]{20,}/g, "ghp_[REDACTED]")
    .replace(/github_pat_[a-zA-Z0-9_]{20,}/g, "github_pat_[REDACTED]");
}
