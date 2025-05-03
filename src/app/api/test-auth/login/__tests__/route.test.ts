/**
 * Unit tests for the testEndpointAllowed function (equivalent to isEndpointAllowed in route.ts)
 */

import { testEndpointAllowed } from '@/lib/tests/testEndpointAllowed';
import { createMockEnv } from '@/lib/tests/unit';

describe('testEndpointAllowed function', () => {
  describe('in test environment', () => {
    it('should return true when NODE_ENV=test and E2E_MOCK_AUTH_ENABLED=true', () => {
      const mockEnv = createMockEnv({
        NODE_ENV: 'test',
        E2E_MOCK_AUTH_ENABLED: 'true',
        ALLOW_E2E_IN_DEV: 'false'
      });
      
      expect(testEndpointAllowed(mockEnv)).toBe(true);
    });
    
    it('should return false when NODE_ENV=test but E2E_MOCK_AUTH_ENABLED is not true', () => {
      const mockEnv = createMockEnv({
        NODE_ENV: 'test',
        E2E_MOCK_AUTH_ENABLED: 'false',
        ALLOW_E2E_IN_DEV: 'false'
      });
      
      expect(testEndpointAllowed(mockEnv)).toBe(false);
      
      const mockEnvUndefined = createMockEnv({
        NODE_ENV: 'test',
        E2E_MOCK_AUTH_ENABLED: undefined,
        ALLOW_E2E_IN_DEV: 'false'
      });
      
      expect(testEndpointAllowed(mockEnvUndefined)).toBe(false);
    });
  });
  
  describe('in development environment', () => {
    it('should return true when NODE_ENV=development and ALLOW_E2E_IN_DEV=true', () => {
      const mockEnv = createMockEnv({
        NODE_ENV: 'development',
        E2E_MOCK_AUTH_ENABLED: 'false',
        ALLOW_E2E_IN_DEV: 'true'
      });
      
      expect(testEndpointAllowed(mockEnv)).toBe(true);
    });
    
    it('should return false when NODE_ENV=development but ALLOW_E2E_IN_DEV is not true', () => {
      const mockEnv = createMockEnv({
        NODE_ENV: 'development',
        E2E_MOCK_AUTH_ENABLED: 'true', // Even if this is true
        ALLOW_E2E_IN_DEV: 'false'
      });
      
      expect(testEndpointAllowed(mockEnv)).toBe(false);
      
      const mockEnvUndefined = createMockEnv({
        NODE_ENV: 'development',
        E2E_MOCK_AUTH_ENABLED: 'true',
        ALLOW_E2E_IN_DEV: undefined
      });
      
      expect(testEndpointAllowed(mockEnvUndefined)).toBe(false);
    });
  });
  
  describe('in production environment', () => {
    it('should always return false regardless of other flags', () => {
      const mockEnv = createMockEnv({
        NODE_ENV: 'production',
        E2E_MOCK_AUTH_ENABLED: 'true',
        ALLOW_E2E_IN_DEV: 'true'
      });
      
      expect(testEndpointAllowed(mockEnv)).toBe(false);
    });
  });
});