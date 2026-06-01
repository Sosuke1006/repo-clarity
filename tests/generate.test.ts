import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { generateReadme } from "../src/commands/generate/readme.js";
import { generateIssueTemplates } from "../src/commands/generate/issueTemplates.js";

const fixtures = join(fileURLToPath(import.meta.url), "..", "fixtures");
let tempDir: string;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe("generate commands", () => {
  it("generates README for node-lib fixture", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "repo-clarity-"));
    await cp(join(fixtures, "node-lib"), tempDir, { recursive: true });

    await generateReadme({ path: tempDir, force: true, allowAbsolute: true });
    const readme = await readFile(join(tempDir, "README.md"), "utf-8");

    expect(readme).toContain("# ");
    expect(readme).toContain("Installation");
    expect(readme).toContain("npm install");
  });

  it("generates issue templates", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "repo-clarity-"));
    await cp(join(fixtures, "node-lib"), tempDir, { recursive: true });

    await generateIssueTemplates({ path: tempDir, force: true, allowAbsolute: true });
    const bug = await readFile(
      join(tempDir, ".github", "ISSUE_TEMPLATE", "bug_report.yml"),
      "utf-8",
    );

    expect(bug).toContain("Bug report");
    expect(bug).toContain("Steps to reproduce");
  });
});
