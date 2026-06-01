import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildGenerateContext } from "../../core/generateContext.js";
import { refineReadmeWithLlm, type LlmRefineOptions } from "../../core/llmRefiner.js";
import { scanRepository } from "../../core/repoScanner.js";
import { summarizeRepository } from "../../core/summarizer.js";
import { renderTemplate } from "../../core/templateEngine.js";
import { pathExists } from "../../utils/fs.js";
import { log } from "../../utils/log.js";
import { resolveRepoPath } from "../../utils/paths.js";

export interface RefineReadmeOptions {
  path?: string;
  provider?: "openai" | "ollama";
  model?: string;
  force?: boolean;
  dryRun?: boolean;
}

export async function refineReadme(options: RefineReadmeOptions = {}): Promise<void> {
  const root = await resolveRepoPath(options.path);
  const readmePath = join(root, "README.md");

  const scan = await scanRepository(root);
  const ctx = buildGenerateContext(scan);
  const templateDraft = await renderTemplate("README.md.hbs", {
    ...ctx,
    structure: scan.structure.slice(0, 10),
  });
  const draft = await readExistingOrDraft(root, templateDraft);

  const summary = summarizeRepository(scan);
  const repoContext = [
    summary.description,
    summary.architecture,
    `Entry points: ${summary.entryPoints.join(", ") || "none"}`,
    `Dev commands: ${summary.devCommands.join("; ") || "none"}`,
  ].join("\n");

  const llmOpts: Partial<LlmRefineOptions> = {
    provider: options.provider ?? "openai",
    model: options.model,
  };

  log.info(`Refining README via ${llmOpts.provider}...`);
  const result = await refineReadmeWithLlm(draft, repoContext, llmOpts);

  if (options.dryRun) {
    console.log(result.content);
    log.dim(`Provider: ${result.provider}, model: ${result.model}`);
    return;
  }

  if (!options.force && (await pathExists(readmePath))) {
    log.warn("README.md exists. Use --force to overwrite with refined content.");
    process.exitCode = 1;
    return;
  }

  await writeFile(readmePath, result.content, "utf-8");
  log.success(`Wrote refined README to ${readmePath}`);
}

export async function readExistingOrDraft(
  root: string,
  draft: string,
): Promise<string> {
  const readmePath = join(root, "README.md");
  if (await pathExists(readmePath)) {
    return readFile(readmePath, "utf-8");
  }
  return draft;
}
