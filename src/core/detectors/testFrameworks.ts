import type { TestFrameworkInfo } from "../../types.js";

const FRAMEWORK_SIGNALS: Array<{ file: RegExp | string; framework: string }> = [
  { file: "vitest.config.ts", framework: "Vitest" },
  { file: "vitest.config.js", framework: "Vitest" },
  { file: "jest.config.js", framework: "Jest" },
  { file: "jest.config.ts", framework: "Jest" },
  { file: "pytest.ini", framework: "pytest" },
  { file: "pyproject.toml", framework: "pytest" },
  { file: /^.*\.test\.tsx?$/i, framework: "Vitest/Jest" },
  { file: /^.*\.spec\.tsx?$/i, framework: "Vitest/Jest" },
  { file: /^.*_test\.go$/i, framework: "go test" },
  { file: "Cargo.toml", framework: "cargo test" },
];

export function detectTestFrameworks(filePaths: string[]): TestFrameworkInfo {
  const normalized = filePaths.map((p) => p.replace(/\\/g, "/"));
  const basenames = normalized.map((p) => p.split("/").pop() ?? "");
  const frameworks = new Set<string>();
  const configFiles: string[] = [];

  for (const signal of FRAMEWORK_SIGNALS) {
    if (typeof signal.file === "string") {
      if (basenames.includes(signal.file)) {
        frameworks.add(signal.framework);
        configFiles.push(signal.file);
      }
    } else {
      const pattern = signal.file;
      if (normalized.some((p) => pattern.test(p))) {
        frameworks.add(signal.framework);
      }
    }
  }

  if (basenames.includes("package.json")) {
    const pkgPath = normalized.find((p) => p.endsWith("/package.json") || p === "package.json");
    if (pkgPath) configFiles.push(pkgPath);
  }

  return {
    frameworks: [...frameworks].sort(),
    configFiles: [...new Set(configFiles)].sort(),
  };
}
