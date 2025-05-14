import { filterVulnerabilities } from '../filter';
import { AuditConfig, ProcessedVulnerability } from '../types';

describe('filterVulnerabilities', () => {
  // Mock vulnerabilities for testing
  const mockVulnerabilities: ProcessedVulnerability[] = [
    {
      name: 'package-a',
      severity: 'critical',
      title: 'Critical Vulnerability',
      isDirect: true,
      isProduction: true,
      url: 'https://npmjs.com/advisories/1',
      vulnerableVersions: '<1.0.0',
      paths: ['node_modules/package-a'],
      advisoryId: '1'
    },
    {
      name: 'package-b',
      severity: 'high',
      title: 'High Severity Vulnerability',
      isDirect: false,
      isProduction: true,
      url: 'https://npmjs.com/advisories/2',
      vulnerableVersions: '<2.0.0',
      paths: ['node_modules/package-c/node_modules/package-b'],
      advisoryId: '2'
    },
    {
      name: 'package-d',
      severity: 'moderate',
      title: 'Moderate Vulnerability',
      isDirect: true,
      isProduction: false, // dev dependency
      url: 'https://npmjs.com/advisories/3',
      vulnerableVersions: '<3.0.0',
      paths: ['node_modules/package-d'],
      advisoryId: '3'
    },
    {
      name: 'package-e',
      severity: 'low',
      title: 'Low Vulnerability',
      isDirect: false,
      isProduction: false, // dev dependency
      url: 'https://npmjs.com/advisories/4',
      vulnerableVersions: '<4.0.0',
      paths: ['node_modules/package-f/node_modules/package-e'],
      advisoryId: '4'
    }
  ];

  // Default config for testing
  const defaultConfig: AuditConfig = {
    failOnSeverity: 'high',
    failOnEnv: 'prod',
    reportMinSeverity: 'low',
    includeDev: true,
    allowlistAdvisories: [],
    allowlistPackages: []
  };

  it('should filter vulnerabilities based on severity threshold', () => {
    const config: AuditConfig = {
      ...defaultConfig,
      reportMinSeverity: 'high'
    };

    const result = filterVulnerabilities(mockVulnerabilities, config);
    
    // Should only include critical and high severity
    expect(result.toReport.length).toBe(2);
    expect(result.toReport[0].severity).toBe('critical');
    expect(result.toReport[1].severity).toBe('high');
  });

  it('should exclude development vulnerabilities when specified', () => {
    const config: AuditConfig = {
      ...defaultConfig,
      includeDev: false
    };

    const result = filterVulnerabilities(mockVulnerabilities, config);
    
    // Should only include production vulnerabilities
    expect(result.toReport.length).toBe(2);
    expect(result.toReport.every(v => v.isProduction)).toBe(true);
  });

  it('should exclude allowlisted advisories', () => {
    const config: AuditConfig = {
      ...defaultConfig,
      allowlistAdvisories: ['1', '3'] // Allowlist critical and moderate vulnerabilities
    };

    const result = filterVulnerabilities(mockVulnerabilities, config);
    
    // Should exclude advisories 1 and 3
    expect(result.toReport.length).toBe(2);
    expect(result.toReport.map(v => v.advisoryId)).toEqual(['2', '4']);
  });

  it('should exclude allowlisted packages', () => {
    const config: AuditConfig = {
      ...defaultConfig,
      allowlistPackages: ['package-a', 'package-e']
    };

    const result = filterVulnerabilities(mockVulnerabilities, config);
    
    // Should exclude package-a and package-e
    expect(result.toReport.length).toBe(2);
    expect(result.toReport.map(v => v.name)).toEqual(['package-b', 'package-d']);
  });

  it('should correctly identify production failures', () => {
    const config: AuditConfig = {
      ...defaultConfig,
      failOnSeverity: 'high',
      failOnEnv: 'prod'
    };

    const result = filterVulnerabilities(mockVulnerabilities, config);
    
    // Should identify critical and high production vulnerabilities as failures
    expect(result.prodFailures.length).toBe(2);
    expect(result.prodFailures.every(v => v.isProduction && ['critical', 'high'].includes(v.severity))).toBe(true);
  });

  it('should correctly identify development failures when configured', () => {
    const config: AuditConfig = {
      ...defaultConfig,
      failOnSeverity: 'moderate',
      failOnEnv: 'any'
    };

    const result = filterVulnerabilities(mockVulnerabilities, config);
    
    // Should identify moderate dev vulnerability as failure
    expect(result.devFailures.length).toBe(1);
    expect(result.devFailures[0].name).toBe('package-d');
  });
});