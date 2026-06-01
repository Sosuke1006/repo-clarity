import { join } from "node:path";
import { buildGenerateContext } from "../../core/generateContext.js";
import { refineReadmeWithLlm, type LlmRefineOptions } from "../../core/llmRefiner.js";
import { scanRepository } from "../../core/repoScanner.js";
import { summarizeRepository } from "../../core/summarizer.js";
import { renderTemplate } from "../../core/templateEngine.js";
import type { PathOptions } from "../../types.js";
import { pathExists, readTextIfExists } from "../../utils/fs.js";
import { log } from "../../utils/log.js";
import { resolveRepoPath } from "../../utils/paths.js";
import { writeFileWithinRepo } from "../../utils/writeGuard.js";

export interface RefineReadmeOptions extends PathOptions {
  provider?: "openai" | "ollama";
  model?: string;
  force?: boolean;
  dryRun?: boolean;
  understandLlmRisk?: boolean;
  allowSecretsInLlm?: boolean;
}

export async function refineReadme(options: RefineReadmeOptions = {}): Promise<void> {
  if (!options.understandLlmRisk) {
    throw new Error(
      "refine readme sends repository content to an external LLM. Re-run with --i-understand-llm-risk",
    );
  }

  const root = await resolveRepoPath(options.path, {
    allowAbsolute: options.allowAbsolute,
  });
  const readmeRel = "README.md";

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
    allowSecretsInPayload: options.allowSecretsInLlm,
  };

  log.info(`Refining README via ${llmOpts.provider}...`);
  const result = await refineReadmeWithLlm(draft, repoContext, llmOpts);

  if (options.dryRun) {
    console.log(result.content);
    log.dim(`Provider: ${result.provider}, model: ${result.model}`);
    return;
  }

  if (!options.force && (await pathExists(join(root, readmeRel)))) {
    log.warn("README.md exists. Use --force to overwrite with refined content.");
    process.exitCode = 1;
    return;
  }

  const outPath = await writeFileWithinRepo(root, readmeRel, result.content);
  log.success(`Wrote refined README to ${outPath}`);
}

async function readExistingOrDraft(
  root: string,
  draft: string,
): Promise<string> {
  const readmePath = join(root, "README.md");
  const existing = await readTextIfExists(readmePath);
  if (existing !== null) return existing;
  return draft;
}
