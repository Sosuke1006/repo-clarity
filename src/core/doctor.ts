import { join } from "node:path";
import type { DoctorFinding, DoctorReport, RepoScanResult } from "../types.js";
import { readTextIfExists } from "../utils/fs.js";

export async function runDoctor(scan: RepoScanResult): Promise<DoctorReport> {
  const findings: DoctorFinding[] = [];

  if (!scan.hasLicense) {
    findings.push({
      id: "missing-license",
      severity: "error",
      message: "LICENSE file is missing",
      suggestion: "Add an MIT or Apache-2.0 LICENSE file",
      file: "LICENSE",
    });
  }

  if (!scan.hasReadme) {
    findings.push({
      id: "missing-readme",
      severity: "error",
      message: "README is missing",
      suggestion: "Run: repo-clarity generate readme",
      file: "README.md",
    });
  } else {
    const readmeFinding = await checkReadmeQuality(scan.rootPath);
    if (readmeFinding) findings.push(readmeFinding);
  }

  if (!scan.hasContributing) {
    findings.push({
      id: "missing-contributing",
      severity: "warning",
      message: "CONTRIBUTING.md is missing",
      suggestion: "Run: repo-clarity generate contributing",
      file: "CONTRIBUTING.md",
    });
  }

  if (!scan.hasIssueTemplates) {
    findings.push({
      id: "missing-issue-templates",
      severity: "warning",
      message: "GitHub issue templates are missing",
      suggestion: "Run: repo-clarity generate issue-templates",
      file: ".github/ISSUE_TEMPLATE/",
    });
  }

  if (!scan.hasCodeOfConduct) {
    findings.push({
      id: "missing-coc",
      severity: "warning",
      message: "CODE_OF_CONDUCT.md is missing",
      suggestion: "Add a Contributor Covenant CODE_OF_CONDUCT.md",
      file: "CODE_OF_CONDUCT.md",
    });
  }

  if (!scan.hasSecurityPolicy) {
    findings.push({
      id: "missing-security",
      severity: "info",
      message: "SECURITY.md is missing",
      suggestion: "Add a security policy for responsible disclosure",
      file: "SECURITY.md",
    });
  }

  if (!scan.hasPullRequestTemplate) {
    findings.push({
      id: "missing-pr-template",
      severity: "info",
      message: "Pull request template is missing",
      suggestion: "Add .github/pull_request_template.md",
      file: ".github/pull_request_template.md",
    });
  }

  if (!scan.ci.hasCi) {
    findings.push({
      id: "missing-ci",
      severity: "warning",
      message: "No CI configuration detected",
      suggestion: "Add GitHub Actions workflow under .github/workflows/",
    });
  }

  if (scan.testFrameworks.frameworks.length === 0) {
    findings.push({
      id: "missing-tests",
      severity: "info",
      message: "No test framework detected",
      suggestion: "Add tests and document how to run them in README",
    });
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const score = Math.max(0, 100 - errors * 25 - warnings * 10 - findings.filter((f) => f.severity === "info").length * 3);

  return {
    findings,
    score,
    passed: errors === 0,
  };
}

async function checkReadmeQuality(
  rootPath: string,
): Promise<DoctorFinding | null> {
  const readme =
    (await readTextIfExists(join(rootPath, "README.md"))) ??
    (await readTextIfExists(join(rootPath, "readme.md")));

  if (!readme) return null;

  const lines = readme.trim().split("\n").length;
  const hasInstall = /install|getting started|setup/i.test(readme);
  const hasUsage = /usage|quick start|example/i.test(readme);

  if (lines < 15 || (!hasInstall && !hasUsage)) {
    return {
      id: "weak-readme",
      severity: "warning",
      message: "README appears minimal (missing install/usage sections)",
      suggestion: "Run: repo-clarity generate readme --force",
      file: "README.md",
    };
  }

  return null;
}
