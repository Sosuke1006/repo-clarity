#!/usr/bin/env node
import { Command, type Command as CommandType } from "commander";
import { runDoctorCommand } from "./commands/doctor.js";
import { generateArchitecture } from "./commands/generate/architecture.js";
import { generateContributing } from "./commands/generate/contributing.js";
import { generateIssueTemplates } from "./commands/generate/issueTemplates.js";
import { generateReadme } from "./commands/generate/readme.js";
import { refineReadme } from "./commands/refine/readme.js";
import { runScan } from "./commands/scan.js";
import { runSummary } from "./commands/summary.js";
import type { PathOptions } from "./types.js";

const program = new Command();

program
  .name("repo-clarity")
  .description(
    "Analyze GitHub repositories and generate OSS documentation scaffolding",
  )
  .version("0.1.2")
  .option(
    "--allow-absolute",
    "Allow absolute repository paths (only for directories you trust)",
    false,
  );

function globalPathOpts(cmd: CommandType): PathOptions {
  return { allowAbsolute: Boolean(cmd.optsWithGlobals().allowAbsolute) };
}

program
  .command("scan")
  .description("Scan repository structure, languages, tests, and CI")
  .argument("[path]", "Repository path", ".")
  .action(async function (this: CommandType, path: string) {
    await runScan(path, globalPathOpts(this));
  });

program
  .command("doctor")
  .description("Diagnose missing or weak OSS documentation files")
  .argument("[path]", "Repository path", ".")
  .action(async function (this: CommandType, path: string) {
    await runDoctorCommand(path, globalPathOpts(this));
  });

program
  .command("summary")
  .description("Print architecture overview and dev command suggestions")
  .argument("[path]", "Repository path", ".")
  .action(async function (this: CommandType, path: string) {
    await runSummary(path, globalPathOpts(this));
  });

const generate = program
  .command("generate")
  .description("Generate documentation files from repository analysis");

generate
  .command("readme")
  .description("Generate README.md from repository scan")
  .argument("[path]", "Repository path", ".")
  .option("-f, --force", "Overwrite existing file")
  .option("--dry-run", "Print to stdout instead of writing")
  .action(async function (
    this: CommandType,
    path: string,
    opts: { force?: boolean; dryRun?: boolean },
  ) {
    await generateReadme({
      path,
      ...globalPathOpts(this),
      force: opts.force,
      dryRun: opts.dryRun,
    });
  });

generate
  .command("contributing")
  .description("Generate CONTRIBUTING.md")
  .argument("[path]", "Repository path", ".")
  .option("-f, --force", "Overwrite existing file")
  .option("--dry-run", "Print to stdout instead of writing")
  .action(async function (
    this: CommandType,
    path: string,
    opts: { force?: boolean; dryRun?: boolean },
  ) {
    await generateContributing({
      path,
      ...globalPathOpts(this),
      force: opts.force,
      dryRun: opts.dryRun,
    });
  });

generate
  .command("issue-templates")
  .description("Generate GitHub issue templates (bug + feature)")
  .argument("[path]", "Repository path", ".")
  .option("-f, --force", "Overwrite existing files")
  .option("--dry-run", "Print to stdout instead of writing")
  .action(async function (
    this: CommandType,
    path: string,
    opts: { force?: boolean; dryRun?: boolean },
  ) {
    await generateIssueTemplates({
      path,
      ...globalPathOpts(this),
      force: opts.force,
      dryRun: opts.dryRun,
    });
  });

generate
  .command("architecture")
  .description("Generate docs/ARCHITECTURE.md with dependency graph")
  .argument("[path]", "Repository path", ".")
  .option("-f, --force", "Overwrite existing file")
  .option("--dry-run", "Print to stdout instead of writing")
  .option("-o, --output <file>", "Output path relative to repo", "docs/ARCHITECTURE.md")
  .action(async function (
    this: CommandType,
    path: string,
    opts: { force?: boolean; dryRun?: boolean; output?: string },
  ) {
    await generateArchitecture({
      path,
      ...globalPathOpts(this),
      force: opts.force,
      dryRun: opts.dryRun,
      output: opts.output,
    });
  });

const refine = program
  .command("refine")
  .description("Optional LLM-assisted documentation improvements");

refine
  .command("readme")
  .description("Refine README using OpenAI or Ollama (requires API key for OpenAI)")
  .argument("[path]", "Repository path", ".")
  .option("--provider <name>", "openai or ollama", "openai")
  .option("--model <name>", "Model id")
  .option("-f, --force", "Overwrite existing README.md")
  .option("--dry-run", "Print result without writing")
  .option(
    "--i-understand-llm-risk",
    "Acknowledge repository content is sent to an external LLM",
    false,
  )
  .option(
    "--allow-secrets-in-llm",
    "Allow sending content that matches secret patterns (dangerous)",
    false,
  )
  .action(async function (
    this: CommandType,
    path: string,
    opts: {
      provider?: string;
      model?: string;
      force?: boolean;
      dryRun?: boolean;
      iUnderstandLlmRisk?: boolean;
      allowSecretsInLlm?: boolean;
    },
  ) {
    const provider = opts.provider === "ollama" ? "ollama" : "openai";
    await refineReadme({
      path,
      ...globalPathOpts(this),
      provider,
      model: opts.model,
      force: opts.force,
      dryRun: opts.dryRun,
      understandLlmRisk: opts.iUnderstandLlmRisk,
      allowSecretsInLlm: opts.allowSecretsInLlm,
    });
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
