import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildGenerateContext } from "../../core/generateContext.js";
import { scanRepository } from "../../core/repoScanner.js";
import { renderTemplate } from "../../core/templateEngine.js";
import { pathExists } from "../../utils/fs.js";
import { log } from "../../utils/log.js";
import { resolveRepoPath } from "../../utils/paths.js";

export interface GenerateOptions {
  path?: string;
  force?: boolean;
  dryRun?: boolean;
}

export async function generateReadme(options: GenerateOptions = {}): Promise<void> {
  const root = await resolveRepoPath(options.path);
  const outPath = join(root, "README.md");

  if (!options.force && (await pathExists(outPath))) {
    log.warn("README.md already exists. Use --force to overwrite.");
    process.exitCode = 1;
    return;
  }

  const scan = await scanRepository(root);
  const ctx = buildGenerateContext(scan);
  const content = await renderTemplate("README.md.hbs", {
    ...ctx,
    structure: scan.structure.slice(0, 10),
  });

  if (options.dryRun) {
    console.log(content);
    return;
  }

  await writeFile(outPath, content, "utf-8");
  log.success(`Wrote ${outPath}`);
}
