import { scanRepository } from "../core/repoScanner.js";
import { summarizeRepository } from "../core/summarizer.js";
import { log } from "../utils/log.js";
import { resolveRepoPath } from "../utils/paths.js";

export async function runSummary(path?: string): Promise<void> {
  const root = await resolveRepoPath(path);
  const scan = await scanRepository(root);
  const summary = summarizeRepository(scan);

  log.heading(`\n${summary.name} — Summary\n`);
  console.log(summary.description);
  console.log();

  log.heading("Architecture");
  console.log(summary.architecture);
  console.log();

  if (summary.entryPoints.length > 0) {
    log.heading("Entry points");
    for (const ep of summary.entryPoints) {
      console.log(`  • ${ep}`);
    }
    console.log();
  }

  if (summary.devCommands.length > 0) {
    log.heading("Suggested dev commands");
    for (const cmd of summary.devCommands) {
      console.log(`  • ${cmd}`);
    }
    console.log();
  }

  log.heading("OSS health");
  console.log(summary.ossHealth);
}
