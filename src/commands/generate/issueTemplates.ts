import { mkdir } from "node:fs/promises";
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

export async function generateIssueTemplates(
  options: GenerateOptions = {},
): Promise<void> {
  const root = await resolveRepoPath(options.path, {
    allowAbsolute: options.allowAbsolute,
  });
  const bugRel = ".github/ISSUE_TEMPLATE/bug_report.yml";
  const featureRel = ".github/ISSUE_TEMPLATE/feature_request.yml";

  if (
    !options.force &&
    ((await pathExists(join(root, bugRel))) ||
      (await pathExists(join(root, featureRel))))
  ) {
    log.warn("Issue templates already exist. Use --force to overwrite.");
    process.exitCode = 1;
    return;
  }

  const scan = await scanRepository(root);
  const ctx = buildGenerateContext(scan);

  const bug = await renderTemplate("bug_report.yml.hbs", ctx);
  const feature = await renderTemplate("feature_request.yml.hbs", ctx);

  if (options.dryRun) {
    log.heading("bug_report.yml");
    console.log(bug);
    log.heading("feature_request.yml");
    console.log(feature);
    return;
  }

  await mkdir(join(root, ".github", "ISSUE_TEMPLATE"), { recursive: true });
  await writeFileWithinRepo(root, bugRel, bug);
  await writeFileWithinRepo(root, featureRel, feature);
  log.success(`Wrote ${join(root, bugRel)}`);
  log.success(`Wrote ${join(root, featureRel)}`);
}
