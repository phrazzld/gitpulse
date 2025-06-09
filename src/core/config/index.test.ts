/**
 * Tests for configuration management
 */

import { 
  DEFAULT_CONFIG, 
  createConfig, 
  validateConfig, 
  extractValidationConfig,
  createValidatedConfig 
} from './index';
import type { Config, PartialConfig } from './index';

describe('Configuration Management', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have all required configuration sections', () => {
      expect(DEFAULT_CONFIG.github).toBeDefined();
      expect(DEFAULT_CONFIG.validation).toBeDefined();
      expect(DEFAULT_CONFIG.api).toBeDefined();
      expect(DEFAULT_CONFIG.cache).toBeDefined();
      expect(DEFAULT_CONFIG.effects).toBeDefined();
      expect(DEFAULT_CONFIG.ui).toBeDefined();
      expect(DEFAULT_CONFIG.ai).toBeDefined();
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_CONFIG.github.pagination.perPage).toBe(100);
      expect(DEFAULT_CONFIG.validation.limits.maxRepositories).toBe(100);
      expect(DEFAULT_CONFIG.validation.limits.maxUsers).toBe(50);
      expect(DEFAULT_CONFIG.api.defaultLimit).toBe(50);
      expect(DEFAULT_CONFIG.effects.retry.maxAttempts).toBe(3);
    });
  });

  describe('createConfig', () => {
    it('should return default config when no overrides provided', () => {
      const config = createConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge partial overrides with defaults', () => {
      const overrides: PartialConfig = {
        validation: {
          limits: {
            maxRepositories: 200
          }
        }
      };

      const config = createConfig(overrides);
      
      expect(config.validation.limits.maxRepositories).toBe(200);
      expect(config.validation.limits.maxUsers).toBe(DEFAULT_CONFIG.validation.limits.maxUsers);
      expect(config.github.pagination.perPage).toBe(DEFAULT_CONFIG.github.pagination.perPage);
    });

    it('should handle deep nested overrides', () => {
      const overrides: PartialConfig = {
        github: {
          pagination: {
            perPage: 50
          }
        },
        effects: {
          retry: {
            maxAttempts: 5
          }
        }
      };

      const config = createConfig(overrides);
      
      expect(config.github.pagination.perPage).toBe(50);
      expect(config.github.pagination.batchSize).toBe(DEFAULT_CONFIG.github.pagination.batchSize);
      expect(config.effects.retry.maxAttempts).toBe(5);
      expect(config.effects.retry.delayMs).toBe(DEFAULT_CONFIG.effects.retry.delayMs);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const result = validateConfig(DEFAULT_CONFIG);
      expect(result.success).toBe(true);
    });

    it('should reject non-object configuration', () => {
      const result = validateConfig('invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error[0].field).toBe('config');
      }
    });

    it('should validate GitHub timeout', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIG,
        github: {
          ...DEFAULT_CONFIG.github,
          timeout: -1
        }
      };

      const result = validateConfig(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.field === 'github.timeout')).toBe(true);
      }
    });

    it('should validate GitHub pagination limits', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIG,
        github: {
          ...DEFAULT_CONFIG.github,
          pagination: {
            ...DEFAULT_CONFIG.github.pagination,
            perPage: 200 // Invalid: > 100
          }
        }
      };

      const result = validateConfig(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.field === 'github.pagination.perPage')).toBe(true);
      }
    });

    it('should validate date range limits', () => {
      const invalidConfig = {
        ...DEFAULT_CONFIG,
        validation: {
          ...DEFAULT_CONFIG.validation,
          limits: {
            ...DEFAULT_CONFIG.validation.limits,
            minDateRangeDays: 10,
            maxDateRangeDays: 5 // Invalid: min > max
          }
        }
      };

      const result = validateConfig(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.field === 'validation.limits')).toBe(true);
      }
    });
  });

  describe('extractValidationConfig', () => {
    it('should extract validation configuration from full config', () => {
      const validationConfig = extractValidationConfig(DEFAULT_CONFIG);
      
      expect(validationConfig.maxRepositories).toBe(DEFAULT_CONFIG.validation.limits.maxRepositories);
      expect(validationConfig.maxDateRangeDays).toBe(DEFAULT_CONFIG.validation.limits.maxDateRangeDays);
      expect(validationConfig.maxUsers).toBe(DEFAULT_CONFIG.validation.limits.maxUsers);
      expect(validationConfig.allowFutureDates).toBe(DEFAULT_CONFIG.validation.rules.allowFutureDates);
      expect(validationConfig.maxBranchNameLength).toBe(DEFAULT_CONFIG.validation.limits.maxBranchNameLength);
    });

    it('should work with custom configuration', () => {
      const customConfig = createConfig({
        validation: {
          limits: {
            maxRepositories: 200,
            maxUsers: 25
          },
          rules: {
            allowFutureDates: true
          }
        }
      });

      const validationConfig = extractValidationConfig(customConfig);
      
      expect(validationConfig.maxRepositories).toBe(200);
      expect(validationConfig.maxUsers).toBe(25);
      expect(validationConfig.allowFutureDates).toBe(true);
    });
  });

  describe('createValidatedConfig', () => {
    it('should create and validate config successfully', () => {
      const result = createValidatedConfig({
        validation: {
          limits: {
            maxRepositories: 75
          }
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validation.limits.maxRepositories).toBe(75);
      }
    });

    it('should return validation errors for invalid config', () => {
      const result = createValidatedConfig({
        github: {
          timeout: -1
        }
      } as any);

      expect(result.success).toBe(false);
    });
  });
});