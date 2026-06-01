import type { PackageManagerInfo } from "../../types.js";

const LOCKFILE_MAP: Record<string, string> = {
  "package-lock.json": "npm",
  "yarn.lock": "yarn",
  "pnpm-lock.yaml": "pnpm",
  "bun.lockb": "bun",
  "bun.lock": "bun",
  "Cargo.lock": "cargo",
  "poetry.lock": "poetry",
  "Pipfile.lock": "pipenv",
  "uv.lock": "uv",
  "composer.lock": "composer",
  "Gemfile.lock": "bundler",
  "go.sum": "go modules",
};

export function detectPackageManagers(filePaths: string[]): PackageManagerInfo {
  const basenames = new Set(
    filePaths.map((p) => p.replace(/\\/g, "/").split("/").pop() ?? ""),
  );

  const managers = new Set<string>();
  const lockfiles: string[] = [];

  if (basenames.has("package.json")) managers.add("npm");
  if (basenames.has("pyproject.toml") || basenames.has("setup.py")) managers.add("pip/poetry");
  if (basenames.has("Cargo.toml")) managers.add("cargo");
  if (basenames.has("go.mod")) managers.add("go modules");
  if (basenames.has("Gemfile")) managers.add("bundler");
  if (basenames.has("composer.json")) managers.add("composer");

  for (const [lockfile, manager] of Object.entries(LOCKFILE_MAP)) {
    if (basenames.has(lockfile)) {
      lockfiles.push(lockfile);
      managers.add(manager);
    }
  }

  return {
    managers: [...managers].sort(),
    lockfiles: lockfiles.sort(),
  };
}
