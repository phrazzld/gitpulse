/**
 * Configuration management for GitPulse
 * Provides default configuration and validation for dependency injection
 */

import { Result, success, failure } from '../../lib/result/index';
import type { Config } from '../types/index';

// Re-export Config type for external use
export type { Config } from '../types/index';

/**
 * Partial configuration type for overrides
 * Allows nested partial overrides while maintaining type safety
 */
export type PartialConfig = {
  readonly [K in keyof Config]?: {
    readonly [P in keyof Config[K]]?: Config[K][P] extends object
      ? Partial<Config[K][P]>
      : Config[K][P];
  };
};

/**
 * Default configuration values
 * Contains all hardcoded values extracted from the codebase
 */
export const DEFAULT_CONFIG: Config = {
  github: {
    apiUrl: 'https://api.github.com',
    timeout: 30000,
    rateLimit: {
      maxRequests: 5000,
      windowMs: 3600000, // 1 hour
    },
    pagination: {
      perPage: 100,
      batchSize: 5,
    },
  },
  validation: {
    limits: {
      maxRepositories: 100,
      maxDateRangeDays: 365,
      minDateRangeDays: 0,
      maxUsers: 50,
      maxBranchNameLength: 250,
    },
    rules: {
      allowFutureDates: false,
    },
  },
  api: {
    timeout: 30000,
    defaultLimit: 50,
    pagination: {
      defaultPageSize: 50,
      maxPageSize: 100,
    },
  },
  cache: {
    ttl: {
      short: 60,      // 1 minute
      medium: 300,    // 5 minutes
      long: 3600,     // 1 hour
    },
    staleWhileRevalidate: 60,
  },
  effects: {
    retry: {
      maxAttempts: 3,
      delayMs: 1000,
    },
    timeout: {
      defaultMs: 30000,
    },
  },
  ui: {
    progressiveLoading: {
      initialLimit: 20,
      additionalItemsPerPage: 20,
    },
    summary: {
      topRepositoriesLimit: 5,
    },
    debounce: {
      defaultDelayMs: 300,
    },
  },
  ai: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-pro',
    maxTokens: 4096,
  },
} as const;

/**
 * Configuration validation errors
 */
export interface ConfigValidationError {
  readonly field: string;
  readonly message: string;
  readonly value: unknown;
}

/**
 * Validate a configuration object
 */
export const validateConfig = (config: unknown): Result<Config, ConfigValidationError[]> => {
  const errors: ConfigValidationError[] = [];

  if (typeof config !== 'object' || config === null) {
    return failure([{
      field: 'config',
      message: 'Configuration must be an object',
      value: config
    }]);
  }

  const cfg = config as any;

  // Validate GitHub configuration
  if (cfg.github) {
    if (typeof cfg.github.timeout !== 'number' || cfg.github.timeout <= 0) {
      errors.push({
        field: 'github.timeout',
        message: 'GitHub timeout must be a positive number',
        value: cfg.github.timeout
      });
    }

    if (cfg.github.pagination?.perPage && 
        (typeof cfg.github.pagination.perPage !== 'number' || 
         cfg.github.pagination.perPage <= 0 || 
         cfg.github.pagination.perPage > 100)) {
      errors.push({
        field: 'github.pagination.perPage',
        message: 'GitHub per_page must be between 1 and 100',
        value: cfg.github.pagination.perPage
      });
    }

    if (cfg.github.pagination?.batchSize && 
        (typeof cfg.github.pagination.batchSize !== 'number' || 
         cfg.github.pagination.batchSize <= 0)) {
      errors.push({
        field: 'github.pagination.batchSize',
        message: 'GitHub batch size must be a positive number',
        value: cfg.github.pagination.batchSize
      });
    }
  }

  // Validate validation limits
  if (cfg.validation?.limits) {
    const limits = cfg.validation.limits;
    
    if (typeof limits.maxRepositories !== 'number' || limits.maxRepositories <= 0) {
      errors.push({
        field: 'validation.limits.maxRepositories',
        message: 'Max repositories must be a positive number',
        value: limits.maxRepositories
      });
    }

    if (typeof limits.maxDateRangeDays !== 'number' || limits.maxDateRangeDays <= 0) {
      errors.push({
        field: 'validation.limits.maxDateRangeDays',
        message: 'Max date range days must be a positive number',
        value: limits.maxDateRangeDays
      });
    }

    if (typeof limits.minDateRangeDays !== 'number' || limits.minDateRangeDays < 0) {
      errors.push({
        field: 'validation.limits.minDateRangeDays',
        message: 'Min date range days must be a non-negative number',
        value: limits.minDateRangeDays
      });
    }

    if (limits.minDateRangeDays >= limits.maxDateRangeDays) {
      errors.push({
        field: 'validation.limits',
        message: 'Min date range days must be less than max date range days',
        value: { min: limits.minDateRangeDays, max: limits.maxDateRangeDays }
      });
    }

    if (typeof limits.maxUsers !== 'number' || limits.maxUsers <= 0) {
      errors.push({
        field: 'validation.limits.maxUsers',
        message: 'Max users must be a positive number',
        value: limits.maxUsers
      });
    }
  }

  // Validate effect configuration
  if (cfg.effects) {
    if (cfg.effects.retry?.maxAttempts && 
        (typeof cfg.effects.retry.maxAttempts !== 'number' || 
         cfg.effects.retry.maxAttempts <= 0)) {
      errors.push({
        field: 'effects.retry.maxAttempts',
        message: 'Effect retry max attempts must be a positive number',
        value: cfg.effects.retry.maxAttempts
      });
    }

    if (cfg.effects.retry?.delayMs && 
        (typeof cfg.effects.retry.delayMs !== 'number' || 
         cfg.effects.retry.delayMs < 0)) {
      errors.push({
        field: 'effects.retry.delayMs',
        message: 'Effect retry delay must be a non-negative number',
        value: cfg.effects.retry.delayMs
      });
    }
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(config as Config);
};

/**
 * Create a complete configuration by merging defaults with overrides
 * Deep merges nested objects while maintaining immutability
 */
export const createConfig = (overrides: PartialConfig = {}): Config => {
  return deepMerge(DEFAULT_CONFIG, overrides as any);
};

/**
 * Deep merge utility for configuration objects
 * Preserves readonly properties and immutability
 */
const deepMerge = (target: any, source: any): any => {
  if (source === null || source === undefined) {
    return target;
  }

  if (typeof source !== 'object' || typeof target !== 'object') {
    return source;
  }

  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && 
          typeof target[key] === 'object' && target[key] !== null) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
};

/**
 * Extract validation configuration from app configuration
 * Maintains compatibility with existing validation system
 */
export const extractValidationConfig = (config: Config) => ({
  maxRepositories: config.validation.limits.maxRepositories,
  maxDateRangeDays: config.validation.limits.maxDateRangeDays,
  minDateRangeDays: config.validation.limits.minDateRangeDays,
  maxUsers: config.validation.limits.maxUsers,
  maxBranchNameLength: config.validation.limits.maxBranchNameLength,
  allowFutureDates: config.validation.rules.allowFutureDates,
});

/**
 * Type alias for validation configuration
 */
export type ValidationConfig = ReturnType<typeof extractValidationConfig>;

/**
 * Validate and create configuration from environment or overrides
 */
export const createValidatedConfig = (
  overrides: PartialConfig = {}
): Result<Config, ConfigValidationError[]> => {
  const config = createConfig(overrides);
  return validateConfig(config);
};

/**
 * Create a validation configuration with defaults for testing
 * Allows partial overrides while maintaining all required fields
 */
export const createValidationConfig = (
  overrides: Partial<ValidationConfig> = {}
): ValidationConfig => {
  const defaultValidationConfig = extractValidationConfig(DEFAULT_CONFIG);
  return { ...defaultValidationConfig, ...overrides };
};