import { join } from "node:path";
import { detectCi } from "./detectors/ci.js";
import { detectLanguages, primaryLanguage } from "./detectors/languages.js";
import { detectPackageManagers } from "./detectors/packageManagers.js";
import { detectTestFrameworks } from "./detectors/testFrameworks.js";
import type { RepoScanResult } from "../types.js";
import { listTopLevel, pathExists, readTextIfExists, walkFiles } from "../utils/fs.js";
import { repoNameFromPath } from "../utils/paths.js";

const ENTRY_POINT_CANDIDATES = [
  "src/index.ts",
  "src/main.ts",
  "src/cli.ts",
  "src/index.js",
  "src/main.js",
  "index.ts",
  "index.js",
  "main.py",
  "app.py",
  "src/lib.rs",
  "src/main.rs",
  "cmd/main.go",
  "main.go",
];

export async function scanRepository(rootPath: string): Promise<RepoScanResult> {
  const files = await walkFiles(rootPath);
  const relativeFiles = files.map((f) => f.replace(rootPath, "").replace(/^[/\\]/, ""));

  const languages = detectLanguages(relativeFiles);
  const packageManagers = detectPackageManagers(relativeFiles);
  const testFrameworks = detectTestFrameworks(relativeFiles);
  const ci = detectCi(relativeFiles);

  const hasReadme = await hasAny(rootPath, ["README.md", "README.MD", "readme.md"]);
  const hasLicense = await hasAny(rootPath, ["LICENSE", "LICENSE.md", "LICENSE.txt"]);
  const hasContributing = await hasAny(rootPath, [
    "CONTRIBUTING.md",
    ".github/CONTRIBUTING.md",
  ]);
  const hasCodeOfConduct = await hasAny(rootPath, [
    "CODE_OF_CONDUCT.md",
    ".github/CODE_OF_CONDUCT.md",
  ]);
  const hasIssueTemplates = await issueTemplatesExist(rootPath);
  const hasPullRequestTemplate = await hasAny(rootPath, [
    ".github/pull_request_template.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
    "pull_request_template.md",
  ]);
  const hasSecurityPolicy = await hasAny(rootPath, [
    "SECURITY.md",
    ".github/SECURITY.md",
  ]);

  const scripts = await readPackageScripts(rootPath);
  const entryPoints = await findEntryPoints(relativeFiles);
  const structure = await listTopLevel(rootPath);

  return {
    rootPath,
    name: repoNameFromPath(rootPath),
    languages,
    primaryLanguage: primaryLanguage(languages),
    packageManagers,
    testFrameworks,
    ci,
    hasReadme,
    hasLicense,
    hasContributing,
    hasCodeOfConduct,
    hasIssueTemplates,
    hasPullRequestTemplate,
    hasSecurityPolicy,
    entryPoints,
    scripts,
    structure,
  };
}

async function hasAny(root: string, candidates: string[]): Promise<boolean> {
  for (const c of candidates) {
    if (await pathExists(join(root, c))) return true;
  }
  return false;
}

async function issueTemplatesExist(root: string): Promise<boolean> {
  const dirs = [
    join(root, ".github", "ISSUE_TEMPLATE"),
    join(root, ".github", "issue_template"),
  ];
  for (const dir of dirs) {
    if (await pathExists(dir)) return true;
  }
  return await hasAny(root, [".github/ISSUE_TEMPLATE/bug_report.yml"]);
}

async function readPackageScripts(root: string): Promise<Record<string, string>> {
  const pkgPath = join(root, "package.json");
  const text = await readTextIfExists(pkgPath);
  if (!text) return {};
  try {
    const pkg = JSON.parse(text) as { scripts?: Record<string, string> };
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}

async function findEntryPoints(relativeFiles: string[]): Promise<string[]> {
  const normalized = new Set(relativeFiles.map((f) => f.replace(/\\/g, "/")));
  const found: string[] = [];

  for (const candidate of ENTRY_POINT_CANDIDATES) {
    if (normalized.has(candidate)) found.push(candidate);
  }

  if (found.length === 0) {
    const srcMain = [...normalized].find(
      (f) =>
        f.startsWith("src/") &&
        (f.endsWith("/index.ts") ||
          f.endsWith("/main.ts") ||
          f.endsWith("/lib.rs") ||
          f.endsWith("/__init__.py")),
    );
    if (srcMain) found.push(srcMain);
  }

  return found.slice(0, 8);
}
