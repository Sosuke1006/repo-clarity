import type { LanguageStats } from "../../types.js";

const EXTENSION_MAP: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".java": "Java",
  ".kt": "Kotlin",
  ".rb": "Ruby",
  ".php": "PHP",
  ".cs": "C#",
  ".cpp": "C++",
  ".cc": "C++",
  ".c": "C",
  ".h": "C",
  ".swift": "Swift",
  ".scala": "Scala",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".md": "Markdown",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".json": "JSON",
  ".toml": "TOML",
  ".sh": "Shell",
  ".ps1": "PowerShell",
  ".sql": "SQL",
  ".dart": "Dart",
  ".ex": "Elixir",
  ".exs": "Elixir",
  ".lua": "Lua",
  ".r": "R",
  ".zig": "Zig",
};

const SKIP_EXTENSIONS = new Set([".lock", ".map", ".min.js"]);

export function detectLanguages(filePaths: string[]): LanguageStats[] {
  const counts = new Map<string, { count: number; extensions: Set<string> }>();

  for (const file of filePaths) {
    const ext = getExtension(file);
    if (!ext || SKIP_EXTENSIONS.has(ext)) continue;
    const lang = EXTENSION_MAP[ext];
    if (!lang || lang === "Markdown" || lang === "JSON" || lang === "YAML") continue;

    const entry = counts.get(lang) ?? { count: 0, extensions: new Set<string>() };
    entry.count += 1;
    entry.extensions.add(ext);
    counts.set(lang, entry);
  }

  return [...counts.entries()]
    .map(([language, { count, extensions }]) => ({
      language,
      fileCount: count,
      extensions: [...extensions].sort(),
    }))
    .sort((a, b) => b.fileCount - a.fileCount);
}

function getExtension(filePath: string): string | null {
  const base = filePath.replace(/\\/g, "/").split("/").pop() ?? "";
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return null;
  return base.slice(idx).toLowerCase();
}

export function primaryLanguage(languages: LanguageStats[]): string | null {
  return languages[0]?.language ?? null;
}
