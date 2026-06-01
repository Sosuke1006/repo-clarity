import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

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
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith(".")) {
          if (![".github", ".vscode"].includes(entry.name)) continue;
        }
        await walk(full, depth + 1);
      } else if (entry.isFile()) {
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
    return entries
      .filter((e) => !e.name.startsWith(".") || e.name === ".github")
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .sort();
  } catch {
    return [];
  }
}
