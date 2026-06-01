import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { scanRepository } from "../src/core/repoScanner.js";

const fixtures = join(fileURLToPath(import.meta.url), "..", "fixtures");

describe("scanRepository", () => {
  it("detects TypeScript node library", async () => {
    const result = await scanRepository(join(fixtures, "node-lib"));
    expect(result.primaryLanguage).toBe("TypeScript");
    expect(result.ci.hasCi).toBe(true);
    expect(result.ci.provider).toBe("GitHub Actions");
    expect(result.testFrameworks.frameworks).toContain("Vitest");
    expect(result.entryPoints).toContain("src/index.ts");
    expect(result.scripts.test).toBe("vitest run");
  });

  it("detects Python application", async () => {
    const result = await scanRepository(join(fixtures, "python-app"));
    expect(result.primaryLanguage).toBe("Python");
    expect(result.packageManagers.managers).toContain("pip/poetry");
    expect(result.entryPoints).toContain("main.py");
  });

  it("detects Rust CLI", async () => {
    const result = await scanRepository(join(fixtures, "rust-cli"));
    expect(result.primaryLanguage).toBe("Rust");
    expect(result.packageManagers.managers).toContain("cargo");
    expect(result.entryPoints.some((e) => e.includes("main.rs"))).toBe(true);
  });
});
