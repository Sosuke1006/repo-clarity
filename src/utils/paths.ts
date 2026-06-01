import { assertSafeRepoPath } from "./security.js";

export async function resolveRepoPath(path?: string): Promise<string> {
  return assertSafeRepoPath(path);
}

export function repoNameFromPath(rootPath: string): string {
  const parts = rootPath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || "repository";
}
