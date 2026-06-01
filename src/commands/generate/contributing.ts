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

export async function generateContributing(
  options: GenerateOptions = {},
): Promise<void> {
  const root = await resolveRepoPath(options.path, {
    allowAbsolute: options.allowAbsolute,
  });
  const outRel = "CONTRIBUTING.md";

  if (!options.force && (await pathExists(join(root, outRel)))) {
    log.warn("CONTRIBUTING.md already exists. Use --force to overwrite.");
    process.exitCode = 1;
    return;
  }

  const scan = await scanRepository(root);
  const ctx = buildGenerateContext(scan);
  const content = await renderTemplate("CONTRIBUTING.md.hbs", ctx);

  if (options.dryRun) {
    console.log(content);
    return;
  }

  const outPath = await writeFileWithinRepo(root, outRel, content);
  log.success(`Wrote ${outPath}`);
}
