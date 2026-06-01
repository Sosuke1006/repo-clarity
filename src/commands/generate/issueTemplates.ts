import { mkdir, writeFile } from "node:fs/promises";
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

export async function generateIssueTemplates(
  options: GenerateOptions = {},
): Promise<void> {
  const root = await resolveRepoPath(options.path);
  const templateDir = join(root, ".github", "ISSUE_TEMPLATE");
  const bugPath = join(templateDir, "bug_report.yml");
  const featurePath = join(templateDir, "feature_request.yml");

  if (
    !options.force &&
    ((await pathExists(bugPath)) || (await pathExists(featurePath)))
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

  await mkdir(templateDir, { recursive: true });
  await writeFile(bugPath, bug, "utf-8");
  await writeFile(featurePath, feature, "utf-8");
  log.success(`Wrote ${bugPath}`);
  log.success(`Wrote ${featurePath}`);
}
