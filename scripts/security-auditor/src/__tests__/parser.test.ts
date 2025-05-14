import { parseAuditOutput } from '../parser';
import { ProcessedVulnerability } from '../types';

describe('parseAuditOutput', () => {
  it('should parse valid npm audit JSON output', () => {
    // Mock npm audit JSON output
    const mockAuditOutput = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        'package-a': {
          name: 'package-a',
          severity: 'high',
          isDirect: false,
          via: [
            {
              source: 1234,
              name: 'package-a',
              dependency: 'package-a',
              title: 'Prototype Pollution',
              url: 'https://npmjs.com/advisories/1234',
              severity: 'high',
              range: '<1.0.0',
              vulnerableVersions: '<1.0.0'
            }
          ],
          effects: ['package-b'],
          range: '<1.0.0',
          nodes: [
            'node_modules/package-b/node_modules/package-a'
          ],
          fixAvailable: {
            name: 'package-a',
            version: '1.0.0',
            isSemVerMajor: true
          }
        }
      },
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high: 1,
          critical: 0,
          total: 1
        },
        dependencies: {
          prod: 100,
          dev: 50,
          optional: 0,
          peer: 0,
          peerOptional: 0,
          total: 150
        }
      }
    });

    const result = parseAuditOutput(mockAuditOutput);
    
    // Assert that the result is an array
    expect(Array.isArray(result)).toBe(true);
    
    // Assert that we have the expected vulnerability
    expect(result.length).toBe(1);
    
    const vuln = result[0] as ProcessedVulnerability;
    
    // Assert vulnerability details
    expect(vuln.name).toBe('package-a');
    expect(vuln.severity).toBe('high');
    expect(vuln.title).toBe('Prototype Pollution');
    expect(vuln.isDirect).toBe(false);
    expect(vuln.url).toBe('https://npmjs.com/advisories/1234');
    expect(vuln.vulnerableVersions).toBe('<1.0.0');
    expect(vuln.fix).toBe('Update to package-a@1.0.0');
    expect(vuln.advisoryId).toBe('1234');
  });

  it('should return an empty array for no vulnerabilities', () => {
    const mockAuditOutput = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {},
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high: 0,
          critical: 0,
          total: 0
        },
        dependencies: {
          prod: 100,
          dev: 50,
          optional: 0,
          peer: 0,
          peerOptional: 0,
          total: 150
        }
      }
    });

    const result = parseAuditOutput(mockAuditOutput);
    expect(result).toEqual([]);
  });

  it('should throw an error for invalid JSON', () => {
    const invalidJson = '{invalid json}';
    
    expect(() => {
      parseAuditOutput(invalidJson);
    }).toThrow('Failed to parse npm audit JSON output');
  });
});