import { runDoctor } from "../core/doctor.js";
import { scanRepository } from "../core/repoScanner.js";
import type { PathOptions } from "../types.js";
import { log } from "../utils/log.js";
import { resolveRepoPath } from "../utils/paths.js";

export async function runDoctorCommand(
  path?: string,
  options: PathOptions = {},
): Promise<void> {
  const root = await resolveRepoPath(path, {
    allowAbsolute: options.allowAbsolute,
  });
  const scan = await scanRepository(root);
  const report = await runDoctor(scan);

  log.heading(`\nOSS health check: ${scan.name}`);
  console.log(`Score: ${report.score}/100`);
  console.log(`Status: ${report.passed ? "PASS" : "NEEDS WORK"}\n`);

  if (report.findings.length === 0) {
    log.success("No issues found. Great OSS hygiene!");
    return;
  }

  for (const finding of report.findings) {
    const icon =
      finding.severity === "error"
        ? "✖"
        : finding.severity === "warning"
          ? "⚠"
          : "ℹ";
    const color =
      finding.severity === "error"
        ? log.error
        : finding.severity === "warning"
          ? log.warn
          : log.info;
    color(`${icon} [${finding.severity}] ${finding.message}`);
    if (finding.suggestion) log.dim(`   → ${finding.suggestion}`);
    if (finding.file) log.dim(`   file: ${finding.file}`);
  }

  process.exitCode = report.passed ? 0 : 1;
}
