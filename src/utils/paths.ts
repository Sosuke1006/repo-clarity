import { assertSafeRepoPath, type SafeRepoPathOptions } from "./security.js";

export async function resolveRepoPath(
  path?: string,
  options?: SafeRepoPathOptions,
): Promise<string> {
  return assertSafeRepoPath(path, options);
}

export function repoNameFromPath(rootPath: string): string {
  const parts = rootPath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || "repository";
}
