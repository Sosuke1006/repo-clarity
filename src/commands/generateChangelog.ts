import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ChangelogOptions {
  dryRun?: boolean;
  output?: string;
  tag?: string;
  releaseVersion?: string;
}

interface CommitEntry {
  hash: string;
  subject: string;
  author: string;
}

const SECTION_TITLES: Record<string, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  docs: 'Documentation',
  refactor: 'Code Refactoring',
  chore: 'Maintenance',
};

export function generateChangelog(repoRoot: string, options: ChangelogOptions = {}): string {
  const outputFile = options.output || 'CHANGELOG.md';
  const targetPath = path.resolve(repoRoot, outputFile);

  // リポジトリルート外への書き込み防止
  if (!targetPath.startsWith(path.resolve(repoRoot))) {
    throw new Error(`Write target constrained to repository root: ${outputFile}`);
  }

  // 起点となる最新タグの取得
  let baseTag = options.tag;
  if (!baseTag) {
    try {
      const tags = execSync('git tag --sort=-creatordate', { cwd: repoRoot, encoding: 'utf-8' })
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);
      baseTag = tags[0];
    } catch {
      baseTag = undefined;
    }
  }

  // コミットログの取得
  const gitLogRange = baseTag ? `${baseTag}..HEAD` : 'HEAD';
  let logOutput = '';
  try {
    logOutput = execSync(`git log ${gitLogRange} --pretty=format:"%h|%s|%an"`, {
      cwd: repoRoot,
      encoding: 'utf-8',
    });
  } catch (error) {
    throw new Error(`Failed to retrieve git log: ${(error as Error).message}`);
  }

  const lines = logOutput.split('\n').filter(Boolean);
  const categorized: Record<string, CommitEntry[]> = {
    feat: [],
    fix: [],
    perf: [],
    docs: [],
    refactor: [],
    chore: [],
    other: [],
  };

  const conventionalRegex = /^(feat|fix|perf|docs|refactor|chore)(?:\(([^)]+)\))?:\s*(.+)$/i;

  for (const line of lines) {
    const [hash, subject, author] = line.split('|');
    if (!hash || !subject) continue;

    const match = subject.trim().match(conventionalRegex);
    if (match) {
      const type = match[1].toLowerCase();
      categorized[type]?.push({ hash, subject: subject.trim(), author });
    } else {
      categorized.other.push({ hash, subject: subject.trim(), author });
    }
  }

  // Markdown 生成
  const version = options.releaseVersion || 'Unreleased';
  const dateStr = new Date().toISOString().split('T')[0];
  let markdown = `## [${version}] - ${dateStr}\n\n`;

  for (const [key, title] of Object.entries(SECTION_TITLES)) {
    const list = categorized[key];
    if (list && list.length > 0) {
      markdown += `### ${title}\n\n`;
      for (const item of list) {
        markdown += `- ${item.subject} (${item.hash})\n`;
      }
      markdown += '\n';
    }
  }

  if (categorized.other.length > 0) {
    markdown += `### Other Changes\n\n`;
    for (const item of categorized.other) {
      markdown += `- ${item.subject} (${item.hash})\n`;
    }
    markdown += '\n';
  }

  if (options.dryRun) {
    return markdown;
  }

  // 既存 CHANGELOG があれば先頭にマージ
  let existingContent = '';
  if (fs.existsSync(targetPath)) {
    existingContent = fs.readFileSync(targetPath, 'utf-8');
  } else {
    existingContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }

  const updatedContent = existingContent.startsWith('# Changelog')
    ? existingContent.replace('# Changelog\n\n', `# Changelog\n\n${markdown}`)
    : `${markdown}${existingContent}`;

  fs.writeFileSync(targetPath, updatedContent, 'utf-8');
  return markdown;
}
