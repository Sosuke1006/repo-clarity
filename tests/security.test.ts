import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertPathWithinRepo,
  assertSafeRepoPath,
  detectSecretsInText,
  redactSecrets,
} from "../src/utils/security.js";

let tempDir: string;

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe("assertSafeRepoPath", () => {
  it("rejects relative path traversal outside cwd", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-sec-"), {
      recursive: true,
    });

    const original = process.cwd();
    process.chdir(tempDir);
    try {
      await expect(assertSafeRepoPath("..")).rejects.toThrow(/escapes/);
    } finally {
      process.chdir(original);
    }
  });

  it("rejects absolute paths without allowAbsolute", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-sec-"), {
      recursive: true,
    });
    await expect(assertSafeRepoPath(tempDir)).rejects.toThrow(/allow-absolute/);
  });

  it("allows absolute path with allowAbsolute", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-sec-"), {
      recursive: true,
    });
    const resolved = await assertSafeRepoPath(tempDir, { allowAbsolute: true });
    expect(resolved).toBeTruthy();
  });

  it("allows valid subdirectory", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-sec-"), {
      recursive: true,
    });
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

describe("assertPathWithinRepo", () => {
  it("rejects output path traversal", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-out-"), {
      recursive: true,
    });
    await expect(
      assertPathWithinRepo(tempDir, "../../outside.md"),
    ).rejects.toThrow(/parent directory|stay within/);
  });

  it("allows safe relative output", async () => {
    tempDir = await mkdir(join(tmpdir(), "repo-clarity-out-"), {
      recursive: true,
    });
    const out = await assertPathWithinRepo(tempDir, "docs/ARCHITECTURE.md");
    expect(out.replace(/\\/g, "/")).toContain("/docs/ARCHITECTURE.md");
  });
});

describe("detectSecretsInText", () => {
  it("detects OpenAI-style keys", () => {
    const found = detectSecretsInText("key=sk-abcdefghijklmnopqrstuvwxyz1234567890");
    expect(found).toContain("OpenAI API key");
  });
});

describe("redactSecrets", () => {
  it("redacts API key patterns", () => {
    const input = "key=sk-abcdefghijklmnopqrstuvwxyz1234567890";
    expect(redactSecrets(input)).not.toContain("sk-abcdefghijklmnopqrstuvwxyz");
  });
});
