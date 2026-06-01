import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runDoctor } from "../src/core/doctor.js";
import { scanRepository } from "../src/core/repoScanner.js";

const fixtures = join(fileURLToPath(import.meta.url), "..", "fixtures");

describe("runDoctor", () => {
  it("flags missing OSS files in minimal fixtures", async () => {
    const scan = await scanRepository(join(fixtures, "node-lib"));
    const report = await runDoctor(scan);

    expect(report.findings.some((f) => f.id === "missing-license")).toBe(true);
    expect(report.findings.some((f) => f.id === "missing-readme")).toBe(true);
    expect(report.passed).toBe(false);
    expect(report.score).toBeLessThan(100);
  });
});
