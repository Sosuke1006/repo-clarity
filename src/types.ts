export interface LanguageStats {
  language: string;
  fileCount: number;
  extensions: string[];
}

export interface CiInfo {
  provider: string;
  workflowFiles: string[];
  hasCi: boolean;
}

export interface PackageManagerInfo {
  managers: string[];
  lockfiles: string[];
}

export interface TestFrameworkInfo {
  frameworks: string[];
  configFiles: string[];
}

export interface RepoScanResult {
  rootPath: string;
  name: string;
  languages: LanguageStats[];
  primaryLanguage: string | null;
  packageManagers: PackageManagerInfo;
  testFrameworks: TestFrameworkInfo;
  ci: CiInfo;
  hasReadme: boolean;
  hasLicense: boolean;
  hasContributing: boolean;
  hasCodeOfConduct: boolean;
  hasIssueTemplates: boolean;
  hasPullRequestTemplate: boolean;
  hasSecurityPolicy: boolean;
  entryPoints: string[];
  scripts: Record<string, string>;
  structure: string[];
}

export type DoctorSeverity = "error" | "warning" | "info";

export interface DoctorFinding {
  id: string;
  severity: DoctorSeverity;
  message: string;
  suggestion?: string;
  file?: string;
}

export interface DoctorReport {
  findings: DoctorFinding[];
  score: number;
  passed: boolean;
}

export interface RepoSummary {
  name: string;
  description: string;
  primaryLanguage: string | null;
  architecture: string;
  entryPoints: string[];
  devCommands: string[];
  ossHealth: string;
}

export interface GenerateContext {
  name: string;
  description: string;
  primaryLanguage: string | null;
  languages: string[];
  hasTests: boolean;
  hasCi: boolean;
  ciProvider: string | null;
  packageManagers: string[];
  testFrameworks: string[];
  scripts: Record<string, string>;
  installCommand: string;
  testCommand: string;
  buildCommand: string | null;
  year: number;
}
