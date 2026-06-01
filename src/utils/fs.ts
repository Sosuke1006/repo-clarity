import { lstat, readdir, readFile, realpath, stat } from "node:fs/promises";
import { join } from "node:path";
import { isWithinRoot } from "./security.js";

export const MAX_READ_BYTES = 512 * 1024;

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "target",
  "__pycache__",
  ".venv",
  "venv",
]);

const ALLOWED_DOT_DIRS = new Set([".github", ".vscode"]);

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(path: string): Promise<string | null> {
  if (!(await pathExists(path))) return null;
  const lst = await lstat(path);
  if (lst.isSymbolicLink()) return null;
  const st = await stat(path);
  if (st.size > MAX_READ_BYTES) return null;
  return readFile(path, "utf-8");
}

export async function walkFiles(
  root: string,
  options: { maxDepth?: number; maxFiles?: number } = {},
): Promise<string[]> {
  const maxDepth = options.maxDepth ?? 6;
  const maxFiles = options.maxFiles ?? 5000;
  const results: string[] = [];
  const resolvedRoot = await realpath(root);

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth || results.length >= maxFiles) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) break;
      const full = join(dir, entry.name);

      let lst;
      try {
        lst = await lstat(full);
      } catch {
        continue;
      }

      if (lst.isSymbolicLink()) continue;

      let resolvedFull: string;
      try {
        resolvedFull = await realpath(full);
      } catch {
        continue;
      }

      if (!isWithinRoot(resolvedFull, resolvedRoot)) continue;

      if (lst.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        if (entry.name.startsWith(".") && !ALLOWED_DOT_DIRS.has(entry.name)) {
          continue;
        }
        await walk(full, depth + 1);
      } else if (lst.isFile()) {
        results.push(full);
      }
    }
  }

  await walk(root, 0);
  return results;
}

export async function listTopLevel(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const names: string[] = [];
    for (const e of entries) {
      const full = join(root, e.name);
      const lst = await lstat(full);
      if (lst.isSymbolicLink()) continue;
      if (e.name.startsWith(".") && e.name !== ".github") continue;
      names.push(e.isDirectory() ? `${e.name}/` : e.name);
    }
    return names.sort();
  } catch {
    return [];
  }
}
