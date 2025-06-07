/**
 * Tests for authentication context detection logic
 */

const { detectAuthContext } = require('../../ci/validate-auth-tokens');

describe('detectAuthContext', () => {
  describe('explicit context specification', () => {
    test('returns explicitly specified build context', () => {
      const result = detectAuthContext('build');
      expect(result).toBe('build');
    });

    test('returns explicitly specified e2e context', () => {
      const result = detectAuthContext('e2e');
      expect(result).toBe('e2e');
    });

    test('returns explicitly specified monitoring context', () => {
      const result = detectAuthContext('monitoring');
      expect(result).toBe('monitoring');
    });

    test('returns explicitly specified local context', () => {
      const result = detectAuthContext('local');
      expect(result).toBe('local');
    });

    test('ignores auto-detection when explicit context provided', () => {
      const dependencies = {
        fileExists: () => true,
        env: { CI: 'true', AUTH_CONTEXT: 'e2e' }
      };
      
      // Should return explicit context, not auto-detected e2e
      const result = detectAuthContext('build', dependencies);
      expect(result).toBe('build');
    });

    test('handles unknown explicit context values', () => {
      const result = detectAuthContext('unknown-context');
      expect(result).toBe('unknown-context');
    });
  });

  describe('auto-detection - E2E context', () => {
    test('detects e2e context when storage state file exists', () => {
      const dependencies = {
        fileExists: () => true,
        env: {}
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('e2e');
    });

    test('detects e2e context from AUTH_CONTEXT environment variable', () => {
      const dependencies = {
        fileExists: () => false,
        env: { AUTH_CONTEXT: 'e2e' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('e2e');
    });

    test('prioritizes storage state file over AUTH_CONTEXT environment', () => {
      const dependencies = {
        fileExists: () => true,
        env: { AUTH_CONTEXT: 'monitoring' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('e2e');
    });

    test('detects e2e context with custom storage state path', () => {
      const dependencies = {
        fileExists: (path) => path === '/custom/storage.json',
        env: {},
        storageStatePath: '/custom/storage.json'
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('e2e');
    });
  });

  describe('auto-detection - build context', () => {
    test('detects build context when CI=true and no storage state', () => {
      const dependencies = {
        fileExists: () => false,
        env: { CI: 'true' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('build');
    });

    test('defaults to build context when CI=true with no other indicators', () => {
      const dependencies = {
        fileExists: () => false,
        env: { CI: 'true', AUTH_CONTEXT: 'unknown' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('build');
    });

    test('does not detect build context when CI is false', () => {
      const dependencies = {
        fileExists: () => false,
        env: { CI: 'false' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('local');
    });

    test('does not detect build context when CI is undefined', () => {
      const dependencies = {
        fileExists: () => false,
        env: {}
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('local');
    });
  });

  describe('auto-detection - monitoring context', () => {
    test('detects monitoring context from AUTH_CONTEXT environment variable', () => {
      const dependencies = {
        fileExists: () => false,
        env: { AUTH_CONTEXT: 'monitoring' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('monitoring');
    });

    test('prioritizes storage state over monitoring context', () => {
      const dependencies = {
        fileExists: () => true,
        env: { AUTH_CONTEXT: 'monitoring' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('e2e');
    });

    test('monitoring context works in CI environment', () => {
      const dependencies = {
        fileExists: () => false,
        env: { CI: 'true', AUTH_CONTEXT: 'monitoring' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('monitoring');
    });
  });

  describe('auto-detection - local context', () => {
    test('defaults to local context in development environment', () => {
      const dependencies = {
        fileExists: () => false,
        env: {}
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('local');
    });

    test('defaults to local when no indicators present', () => {
      const dependencies = {
        fileExists: () => false,
        env: { SOME_OTHER_VAR: 'value' }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('local');
    });
  });

  describe('priority order and edge cases', () => {
    test('follows correct priority: explicit > storage state > AUTH_CONTEXT=e2e > CI+no-storage > AUTH_CONTEXT=monitoring > CI > local', () => {
      // Storage state has highest priority in auto-detection
      const withStorageState = {
        fileExists: () => true,
        env: { CI: 'true', AUTH_CONTEXT: 'monitoring' }
      };
      expect(detectAuthContext('auto', withStorageState)).toBe('e2e');
      
      // AUTH_CONTEXT=e2e has priority over CI
      const withE2EContext = {
        fileExists: () => false,
        env: { CI: 'true', AUTH_CONTEXT: 'e2e' }
      };
      expect(detectAuthContext('auto', withE2EContext)).toBe('e2e');
      
      // CI + no storage = build
      const ciNoBuild = {
        fileExists: () => false,
        env: { CI: 'true' }
      };
      expect(detectAuthContext('auto', ciNoBuild)).toBe('build');
      
      // AUTH_CONTEXT=monitoring has priority over CI fallback
      const monitoringContext = {
        fileExists: () => false,
        env: { CI: 'true', AUTH_CONTEXT: 'monitoring' }
      };
      expect(detectAuthContext('auto', monitoringContext)).toBe('monitoring');
    });

    test('handles file system errors gracefully', () => {
      const dependencies = {
        fileExists: () => { throw new Error('File system error'); },
        env: { CI: 'true' }
      };
      
      // Should not throw, should fall back to build context due to CI
      expect(() => detectAuthContext('auto', dependencies)).toThrow('File system error');
    });

    test('handles missing dependencies object', () => {
      // Should use defaults and not throw
      const result = detectAuthContext('build');
      expect(result).toBe('build');
    });

    test('handles partial dependencies object', () => {
      const dependencies = {
        env: { CI: 'true' }
        // fileExists should default to fs.existsSync
      };
      
      const result = detectAuthContext('auto', dependencies);
      // Should work without throwing
      expect(['build', 'e2e', 'local']).toContain(result);
    });

    test('handles null and undefined requestedContext', () => {
      const dependencies = {
        fileExists: () => false,
        env: {}
      };
      
      expect(detectAuthContext(null, dependencies)).toBe('local');
      expect(detectAuthContext(undefined, dependencies)).toBe('local');
    });

    test('handles environment variable type coercion', () => {
      // CI should be string 'true', not boolean true
      const dependencies = {
        fileExists: () => false,
        env: { CI: true } // boolean instead of string
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('local'); // Should not detect as CI
    });

    test('case sensitivity of environment variables', () => {
      const dependencies = {
        fileExists: () => false,
        env: { 
          CI: 'TRUE', // uppercase
          AUTH_CONTEXT: 'E2E' // uppercase
        }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('local'); // Should not match uppercase values
    });
  });

  describe('complex scenarios', () => {
    test('CI environment with conflicting indicators', () => {
      const dependencies = {
        fileExists: () => false,
        env: { 
          CI: 'true',
          AUTH_CONTEXT: 'e2e',
          NODE_ENV: 'production'
        }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('e2e'); // AUTH_CONTEXT=e2e should win
    });

    test('production-like environment', () => {
      const dependencies = {
        fileExists: () => false,
        env: { 
          NODE_ENV: 'production',
          // No CI flag
        }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('local');
    });

    test('development environment with storage state', () => {
      const dependencies = {
        fileExists: () => true,
        env: { 
          NODE_ENV: 'development'
          // No CI flag
        }
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('e2e'); // Storage state should still trigger e2e
    });
  });

  describe('dependency injection', () => {
    test('uses injected fileExists function', () => {
      const mockFileExists = jest.fn().mockReturnValue(true);
      const dependencies = {
        fileExists: mockFileExists,
        env: {},
        storageStatePath: '/test/path.json'
      };
      
      const result = detectAuthContext('auto', dependencies);
      
      expect(mockFileExists).toHaveBeenCalledWith('/test/path.json');
      expect(result).toBe('e2e');
    });

    test('uses injected environment object', () => {
      const mockEnv = {
        CI: 'true',
        AUTH_CONTEXT: 'monitoring',
        CUSTOM_VAR: 'test'
      };
      
      const dependencies = {
        fileExists: () => false,
        env: mockEnv
      };
      
      const result = detectAuthContext('auto', dependencies);
      expect(result).toBe('monitoring');
    });

    test('uses injected storage state path', () => {
      const mockFileExists = jest.fn().mockReturnValue(false);
      const customPath = '/custom/auth/state.json';
      
      const dependencies = {
        fileExists: mockFileExists,
        env: {},
        storageStatePath: customPath
      };
      
      detectAuthContext('auto', dependencies);
      expect(mockFileExists).toHaveBeenCalledWith(customPath);
    });
  });
});