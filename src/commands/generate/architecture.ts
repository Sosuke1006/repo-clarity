import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildArchitectureMarkdown } from "../../core/architectureBuilder.js";
import { buildDependencyGraph } from "../../core/dependencyGraph.js";
import { scanRepository } from "../../core/repoScanner.js";
import { pathExists } from "../../utils/fs.js";
import { log } from "../../utils/log.js";
import { resolveRepoPath } from "../../utils/paths.js";

export interface GenerateOptions {
  path?: string;
  force?: boolean;
  dryRun?: boolean;
  output?: string;
}

export async function generateArchitecture(
  options: GenerateOptions = {},
): Promise<void> {
  const root = await resolveRepoPath(options.path);
  const outRel = options.output ?? "docs/ARCHITECTURE.md";
  const outPath = join(root, outRel);

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
  await writeFile(outPath, content, "utf-8");
  log.success(`Wrote ${outPath}`);
}
