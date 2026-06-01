import type { GenerateContext, RepoScanResult } from "../types.js";

export function buildGenerateContext(scan: RepoScanResult): GenerateContext {
  const scripts = scan.scripts;
  const pm = scan.packageManagers.managers;

  let installCommand = "npm install";
  if (pm.includes("pnpm")) installCommand = "pnpm install";
  else if (pm.includes("yarn")) installCommand = "yarn";
  else if (pm.includes("cargo")) installCommand = "cargo build";
  else if (pm.includes("pip/poetry")) installCommand = "pip install -e .";
  else if (pm.includes("go modules")) installCommand = "go mod download";

  let testCommand = scripts.test ?? "npm test";
  if (!scripts.test && pm.includes("cargo")) testCommand = "cargo test";
  if (!scripts.test && pm.includes("go modules")) testCommand = "go test ./...";

  const buildCommand = scripts.build ?? null;

  return {
    name: scan.name,
    description: `${scan.name} — analyzed and documented with repo-clarity`,
    primaryLanguage: scan.primaryLanguage,
    languages: scan.languages.map((l) => l.language),
    hasTests: scan.testFrameworks.frameworks.length > 0,
    hasCi: scan.ci.hasCi,
    ciProvider: scan.ci.hasCi ? scan.ci.provider : null,
    packageManagers: scan.packageManagers.managers,
    testFrameworks: scan.testFrameworks.frameworks,
    scripts,
    installCommand,
    testCommand,
    buildCommand,
    year: new Date().getFullYear(),
  };
}
