import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { assertSafeRepoPath, redactSecrets } from "../src/utils/security.js";

let tempDir: string;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe("assertSafeRepoPath", () => {
  it("rejects relative path traversal outside cwd", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-sec-"), {
      recursive: true,
    }).then((d) => d);

    const original = process.cwd();
    process.chdir(tempDir);
    try {
      await expect(assertSafeRepoPath("..")).rejects.toThrow(/escapes/);
    } finally {
      process.chdir(original);
    }
  });

  it("allows valid subdirectory", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-sec-"), {
      recursive: true,
    }).then((d) => d);
    const sub = join(tempDir, "repo");
    await mkdir(sub, { recursive: true });

    const original = process.cwd();
    process.chdir(tempDir);
    try {
      const resolved = await assertSafeRepoPath("repo");
      expect(resolved.replace(/\\/g, "/")).toContain("/repo");
    } finally {
      process.chdir(original);
    }
  });
});

describe("redactSecrets", () => {
  it("redacts API key patterns", () => {
    const input = "key=sk-abcdefghijklmnopqrstuvwxyz1234567890";
    expect(redactSecrets(input)).not.toContain("sk-abcdefghijklmnopqrstuvwxyz");
  });
});
