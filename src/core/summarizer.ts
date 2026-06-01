import type { RepoScanResult, RepoSummary } from "../types.js";

export function summarizeRepository(scan: RepoScanResult): RepoSummary {
  const description = buildDescription(scan);
  const architecture = buildArchitecture(scan);
  const devCommands = suggestDevCommands(scan);
  const ossHealth = buildOssHealth(scan);

  return {
    name: scan.name,
    description,
    primaryLanguage: scan.primaryLanguage,
    architecture,
    entryPoints: scan.entryPoints,
    devCommands,
    ossHealth,
  };
}

function buildDescription(scan: RepoScanResult): string {
  const langs =
    scan.languages.length > 0
      ? scan.languages
          .slice(0, 3)
          .map((l) => l.language)
          .join(", ")
      : "unknown languages";
  const pm =
    scan.packageManagers.managers.length > 0
      ? scan.packageManagers.managers.join(", ")
      : "no package manager detected";
  return `${scan.name} is a ${langs} project using ${pm}.`;
}

function buildArchitecture(scan: RepoScanResult): string {
  const parts: string[] = [];

  if (scan.structure.includes("src/")) {
    parts.push("Source code lives under `src/`.");
  }
  if (scan.structure.includes("tests/") || scan.structure.includes("test/")) {
    parts.push("Tests are organized under a dedicated test directory.");
  }
  if (scan.ci.hasCi) {
    parts.push(`CI is configured via ${scan.ci.provider}.`);
  }
  if (scan.entryPoints.length > 0) {
    parts.push(`Main entry points: ${scan.entryPoints.map((e) => `\`${e}\``).join(", ")}.`);
  } else {
    parts.push("No obvious single entry point was detected.");
  }

  const top = scan.structure.slice(0, 12).join(", ");
  parts.push(`Top-level layout: ${top}.`);

  return parts.join(" ");
}

function suggestDevCommands(scan: RepoScanResult): string[] {
  const commands: string[] = [];
  const scripts = scan.scripts;

  if (scripts.install) commands.push(`npm run install (script): ${scripts.install}`);
  if (scripts.test) commands.push(`npm test: ${scripts.test}`);
  if (scripts.build) commands.push(`npm run build: ${scripts.build}`);
  if (scripts.dev) commands.push(`npm run dev: ${scripts.dev}`);
  if (scripts.lint) commands.push(`npm run lint: ${scripts.lint}`);

  if (commands.length === 0) {
    if (scan.packageManagers.managers.includes("npm")) {
      commands.push("npm install", "npm test");
    }
    if (scan.packageManagers.managers.includes("cargo")) {
      commands.push("cargo build", "cargo test");
    }
    if (scan.packageManagers.managers.includes("pip/poetry")) {
      commands.push("pip install -e .", "pytest");
    }
    if (scan.packageManagers.managers.includes("go modules")) {
      commands.push("go build ./...", "go test ./...");
    }
  }

  return [...new Set(commands)].slice(0, 8);
}

function buildOssHealth(scan: RepoScanResult): string {
  const items = [
    scan.hasReadme ? "README" : null,
    scan.hasLicense ? "LICENSE" : null,
    scan.hasContributing ? "CONTRIBUTING" : null,
    scan.hasIssueTemplates ? "issue templates" : null,
    scan.hasCodeOfConduct ? "CODE_OF_CONDUCT" : null,
    scan.ci.hasCi ? "CI" : null,
  ].filter(Boolean);

  const missing = [
    !scan.hasReadme && "README",
    !scan.hasLicense && "LICENSE",
    !scan.hasContributing && "CONTRIBUTING",
    !scan.hasIssueTemplates && "issue templates",
    !scan.ci.hasCi && "CI",
  ].filter(Boolean) as string[];

  if (missing.length === 0) {
    return `Strong OSS hygiene: ${items.join(", ")} present.`;
  }
  return `Present: ${items.join(", ") || "none"}. Missing: ${missing.join(", ")}.`;
}
