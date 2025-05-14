/**
 * TypeScript interfaces for the npm audit security checking script
 */

/**
 * Represents severity levels from npm audit
 */
export type SeverityLevel = 'critical' | 'high' | 'moderate' | 'low' | 'info';

/**
 * Environment scope for vulnerability classification
 */
export type EnvironmentScope = 'prod' | 'dev' | 'any';

/**
 * Configuration options for the audit script
 */
export interface AuditConfig {
  /** Minimum severity level that will cause a non-zero exit code */
  failOnSeverity: SeverityLevel;
  
  /** Environment scope for failure determination */
  failOnEnv: EnvironmentScope;
  
  /** Minimum severity level to include in the report */
  reportMinSeverity: SeverityLevel;
  
  /** Whether to include development dependencies in reporting and failure consideration */
  includeDev: boolean;
  
  /** List of advisory IDs to ignore */
  allowlistAdvisories: string[];
  
  /** List of package name patterns to ignore */
  allowlistPackages: string[];
}

/**
 * npm audit's JSON output structure
 */
export interface AuditReport {
  auditReportVersion: number;
  vulnerabilities: Record<string, Vulnerability>;
  metadata: AuditMetadata;
}

/**
 * Metadata from npm audit report
 */
export interface AuditMetadata {
  vulnerabilities: {
    info: number;
    low: number;
    moderate: number;
    high: number;
    critical: number;
    total: number;
  };
  dependencies: {
    prod: number;
    dev: number;
    optional: number;
    peer: number;
    peerOptional: number;
    total: number;
  };
}

/**
 * Individual vulnerability from npm audit
 */
export interface Vulnerability {
  name: string;
  severity: SeverityLevel;
  isDirect: boolean;
  via: (string | Advisory)[];
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable: FixAvailable | false;
}

/**
 * Advisory details from npm audit
 */
export interface Advisory {
  source: number;
  name: string;
  dependency: string;
  title: string;
  url: string;
  severity: SeverityLevel;
  range: string;
  vulnerableVersions: string;
}

/**
 * Fix information from npm audit
 */
export interface FixAvailable {
  name: string;
  version: string;
  isSemVerMajor: boolean;
}

/**
 * Processed vulnerability with additional classification
 */
export interface ProcessedVulnerability {
  /** Package name */
  name: string;
  
  /** Vulnerability severity */
  severity: SeverityLevel;
  
  /** Vulnerability title/description */
  title: string;
  
  /** Whether this is a direct dependency */
  isDirect: boolean;
  
  /** Is this a production dependency issue */
  isProduction: boolean;
  
  /** URL to the advisory */
  url: string;
  
  /** Affected versions range */
  vulnerableVersions: string;
  
  /** Current version */
  currentVersion?: string;
  
  /** Full dependency paths */
  paths: string[];
  
  /** Recommended fix if available */
  fix?: string;
  
  /** Advisory ID */
  advisoryId: string;
}

/**
 * Result from filtering vulnerabilities
 */
export interface FilterResult {
  /** Vulnerabilities to be reported */
  toReport: ProcessedVulnerability[];
  
  /** Production vulnerabilities that meet failure criteria */
  prodFailures: ProcessedVulnerability[];
  
  /** Development vulnerabilities that meet failure criteria */
  devFailures: ProcessedVulnerability[];
}

/**
 * Script execution result
 */
export interface AuditResult {
  /** Exit code to use */
  exitCode: number;
  
  /** Whether the script execution failed (not vulnerability-related) */
  executionError: boolean;
  
  /** Error message if execution failed */
  errorMessage?: string;
}