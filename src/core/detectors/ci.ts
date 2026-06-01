import type { CiInfo } from "../../types.js";

const WORKFLOW_PATTERNS = [
  { pattern: /\.github\/workflows\/.+\.ya?ml$/i, provider: "GitHub Actions" },
  { pattern: /\.gitlab-ci\.ya?ml$/i, provider: "GitLab CI" },
  { pattern: /azure-pipelines\.ya?ml$/i, provider: "Azure Pipelines" },
  { pattern: /\.circleci\/config\.ya?ml$/i, provider: "CircleCI" },
  { pattern: /Jenkinsfile$/i, provider: "Jenkins" },
  { pattern: /\.travis\.ya?ml$/i, provider: "Travis CI" },
];

export function detectCi(filePaths: string[]): CiInfo {
  const normalized = filePaths.map((p) => p.replace(/\\/g, "/"));
  const workflowFiles: string[] = [];
  const providers = new Set<string>();

  for (const file of normalized) {
    for (const { pattern, provider } of WORKFLOW_PATTERNS) {
      if (pattern.test(file)) {
        workflowFiles.push(file);
        providers.add(provider);
      }
    }
  }

  const provider = providers.has("GitHub Actions")
    ? "GitHub Actions"
    : [...providers][0] ?? "unknown";

  return {
    provider,
    workflowFiles: [...new Set(workflowFiles)].sort(),
    hasCi: workflowFiles.length > 0,
  };
}
