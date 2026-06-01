import { join } from "node:path";
import { buildGenerateContext } from "../../core/generateContext.js";
import { scanRepository } from "../../core/repoScanner.js";
import { renderTemplate } from "../../core/templateEngine.js";
import type { PathOptions } from "../../types.js";
import { pathExists } from "../../utils/fs.js";
import { log } from "../../utils/log.js";
import { resolveRepoPath } from "../../utils/paths.js";
import { writeFileWithinRepo } from "../../utils/writeGuard.js";

export interface GenerateOptions extends PathOptions {
  force?: boolean;
  dryRun?: boolean;
}

export async function generateReadme(options: GenerateOptions = {}): Promise<void> {
  const root = await resolveRepoPath(options.path, {
    allowAbsolute: options.allowAbsolute,
  });
  const outRel = "README.md";

  if (!options.force && (await pathExists(join(root, outRel)))) {
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

  const outPath = await writeFileWithinRepo(root, outRel, content);
  log.success(`Wrote ${outPath}`);
}
