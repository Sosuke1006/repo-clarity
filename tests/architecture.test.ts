import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildArchitectureMarkdown } from "../src/core/architectureBuilder.js";
import { buildDependencyGraph } from "../src/core/dependencyGraph.js";
import { scanRepository } from "../src/core/repoScanner.js";

const fixtures = join(fileURLToPath(import.meta.url), "..", "fixtures");

describe("architecture generation", () => {
  it("builds dependency graph for node-lib", async () => {
    const root = join(fixtures, "node-lib");
    const graph = await buildDependencyGraph(root);
    expect(graph.ecosystem).toBe("npm");
    expect(graph.nodes.length).toBeGreaterThanOrEqual(0);
  });

  it("generates architecture markdown with mermaid", async () => {
    const root = join(fixtures, "node-lib");
    const scan = await scanRepository(root);
    const graph = await buildDependencyGraph(root);
    const md = buildArchitectureMarkdown(scan, graph);

    expect(md).toContain("# Architecture:");
    expect(md).toContain("```mermaid");
    expect(md).toContain("Entry points");
  });
});
