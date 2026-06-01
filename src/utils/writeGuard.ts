import { writeFile } from "node:fs/promises";
import { assertPathWithinRepo } from "./security.js";

export async function writeFileWithinRepo(
  repoRoot: string,
  relativePath: string,
  content: string,
): Promise<string> {
  const outPath = await assertPathWithinRepo(repoRoot, relativePath);
  await writeFile(outPath, content, "utf-8");
  return outPath;
}
