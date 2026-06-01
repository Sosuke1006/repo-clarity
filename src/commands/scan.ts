import { scanRepository } from "../core/repoScanner.js";
import type { PathOptions } from "../types.js";
import { log } from "../utils/log.js";
import { resolveRepoPath } from "../utils/paths.js";

export async function runScan(path?: string, options: PathOptions = {}): Promise<void> {
  const root = await resolveRepoPath(path, {
    allowAbsolute: options.allowAbsolute,
  });
  log.info(`Scanning ${root}...`);

  const result = await scanRepository(root);

  log.heading(`\n${result.name}`);
  log.dim(`Path: ${result.rootPath}\n`);

  if (result.languages.length > 0) {
    log.heading("Languages");
    for (const lang of result.languages.slice(0, 8)) {
      console.log(`  ${lang.language}: ${lang.fileCount} files`);
    }
  }

  log.heading("\nPackage managers");
  console.log(
    `  ${result.packageManagers.managers.join(", ") || "none detected"}`,
  );

  log.heading("\nTest frameworks");
  console.log(
    `  ${result.testFrameworks.frameworks.join(", ") || "none detected"}`,
  );

  log.heading("\nCI");
  console.log(
    result.ci.hasCi
      ? `  ${result.ci.provider} (${result.ci.workflowFiles.length} workflow(s))`
      : "  not detected",
  );

  log.heading("\nOSS files");
  console.log(`  README: ${result.hasReadme ? "yes" : "no"}`);
  console.log(`  LICENSE: ${result.hasLicense ? "yes" : "no"}`);
  console.log(`  CONTRIBUTING: ${result.hasContributing ? "yes" : "no"}`);
  console.log(`  Issue templates: ${result.hasIssueTemplates ? "yes" : "no"}`);

  if (result.entryPoints.length > 0) {
    log.heading("\nEntry points");
    for (const ep of result.entryPoints) {
      console.log(`  ${ep}`);
    }
  }
}
