import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { buildArchitectureMarkdown } from "../../core/architectureBuilder.js";
import { buildDependencyGraph } from "../../core/dependencyGraph.js";
import { scanRepository } from "../../core/repoScanner.js";
import type { PathOptions } from "../../types.js";
import { pathExists } from "../../utils/fs.js";
import { log } from "../../utils/log.js";
import { resolveRepoPath } from "../../utils/paths.js";
import { assertPathWithinRepo } from "../../utils/security.js";
import { writeFileWithinRepo } from "../../utils/writeGuard.js";

export interface GenerateOptions extends PathOptions {
  force?: boolean;
  dryRun?: boolean;
  output?: string;
}

export async function generateArchitecture(
  options: GenerateOptions = {},
): Promise<void> {
  const root = await resolveRepoPath(options.path, {
    allowAbsolute: options.allowAbsolute,
  });
  const outRel = options.output ?? "docs/ARCHITECTURE.md";

  const outPath = await assertPathWithinRepo(root, outRel);

  if (!options.force && (await pathExists(outPath))) {
    log.warn(`${outRel} already exists. Use --force to overwrite.`);
    process.exitCode = 1;
    return;
  }

  const scan = await scanRepository(root);
  const graph = await buildDependencyGraph(root);
  const content = buildArchitectureMarkdown(scan, graph);

  if (options.dryRun) {
    console.log(content);
    return;
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFileWithinRepo(root, outRel, content);
  log.success(`Wrote ${outPath}`);
}
