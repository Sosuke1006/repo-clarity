import { join } from "node:path";
import { pathExists, readTextIfExists } from "../utils/fs.js";

export interface DependencyNode {
  name: string;
  version?: string;
  kind: "runtime" | "dev" | "peer" | "optional" | "build";
}

export interface DependencyGraph {
  ecosystem: string;
  nodes: DependencyNode[];
  manifestPath: string | null;
}

export async function buildDependencyGraph(
  rootPath: string,
): Promise<DependencyGraph> {
  const npm = await parsePackageJson(rootPath);
  if (npm.manifestPath) return npm;

  const cargo = await parseCargoToml(rootPath);
  if (cargo.manifestPath) return cargo;

  const python = await parsePyproject(rootPath);
  if (python.manifestPath) return python;

  return {
    ecosystem: "unknown",
    nodes: [],
    manifestPath: null,
  };
}

async function parsePackageJson(root: string): Promise<DependencyGraph> {
  const manifestPath = join(root, "package.json");
  const text = await readTextIfExists(manifestPath);
  if (!text) {
    return { ecosystem: "npm", nodes: [], manifestPath: null };
  }

  const nodes: DependencyNode[] = [];
  try {
    const pkg = JSON.parse(text) as Record<
      string,
      Record<string, string> | undefined
    >;
    pushDeps(nodes, pkg.dependencies, "runtime");
    pushDeps(nodes, pkg.devDependencies, "dev");
    pushDeps(nodes, pkg.peerDependencies, "peer");
    pushDeps(nodes, pkg.optionalDependencies, "optional");
  } catch {
    return { ecosystem: "npm", nodes: [], manifestPath };
  }

  return {
    ecosystem: "npm",
    nodes: nodes.sort((a, b) => a.name.localeCompare(b.name)),
    manifestPath,
  };
}

function pushDeps(
  nodes: DependencyNode[],
  deps: Record<string, string> | undefined,
  kind: DependencyNode["kind"],
): void {
  if (!deps) return;
  for (const [name, version] of Object.entries(deps)) {
    nodes.push({ name, version, kind });
  }
}

async function parseCargoToml(root: string): Promise<DependencyGraph> {
  const manifestPath = join(root, "Cargo.toml");
  if (!(await pathExists(manifestPath))) {
    return { ecosystem: "cargo", nodes: [], manifestPath: null };
  }

  const text = await readTextIfExists(manifestPath);
  if (!text) {
    return { ecosystem: "cargo", nodes: [], manifestPath };
  }
  const nodes: DependencyNode[] = [];
  const depSection = /\[dependencies\]([\s\S]*?)(?=\n\[|$)/.exec(text);
  if (depSection) {
    for (const line of depSection[1].split("\n")) {
      const m = /^([a-zA-Z0-9_-]+)\s*=\s*["']?([^"'\n]+)/.exec(line.trim());
      if (m) nodes.push({ name: m[1], version: m[2], kind: "runtime" });
    }
  }

  return {
    ecosystem: "cargo",
    nodes: nodes.sort((a, b) => a.name.localeCompare(b.name)),
    manifestPath,
  };
}

async function parsePyproject(root: string): Promise<DependencyGraph> {
  const manifestPath = join(root, "pyproject.toml");
  const text = await readTextIfExists(manifestPath);
  if (!text) {
    return { ecosystem: "python", nodes: [], manifestPath: null };
  }

  const nodes: DependencyNode[] = [];
  const depBlock = /dependencies\s*=\s*\[([\s\S]*?)\]/m.exec(text);
  if (depBlock) {
    const re = /["']([a-zA-Z0-9_-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(depBlock[1])) !== null) {
      nodes.push({ name: m[1], kind: "runtime" });
    }
  }

  return {
    ecosystem: "python",
    nodes: nodes.sort((a, b) => a.name.localeCompare(b.name)),
    manifestPath,
  };
}
