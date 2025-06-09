/**
 * Structured logging for effects with correlation ID support
 * Integrates with existing GitPulse logger while adding effect-specific features
 */

import { randomUUID } from 'crypto';
import { Effect, IOEffect, LogEffect } from './types';
import { logger } from '../../lib/logger';

/**
 * Logging context that gets propagated through effect chains
 */
export interface LoggingContext {
  readonly correlationId: string;
  readonly operationName: string;
  readonly startTime: Date;
  readonly parentContext?: LoggingContext;
}

/**
 * Structured log entry format
 */
interface StructuredLogEntry {
  readonly level: 'info' | 'error' | 'warn' | 'debug';
  readonly correlationId: string;
  readonly operationName: string;
  readonly message: string;
  readonly timestamp: string;
  readonly effectType?: string;
  readonly durationMs?: number;
  readonly result?: any;
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
  };
}

/**
 * Thread-local storage for logging context
 * In a real application, this might use AsyncLocalStorage or similar
 */
const contextStore = new Map<symbol, LoggingContext>();

/**
 * Generate a new correlation ID
 */
export const createCorrelationId = (): string => randomUUID();

/**
 * Create a new logging context
 */
export const createLoggingContext = (
  operationName: string,
  correlationId?: string,
  parentContext?: LoggingContext
): LoggingContext => ({
  correlationId: correlationId || createCorrelationId(),
  operationName,
  startTime: new Date(),
  parentContext
});

/**
 * Get the current logging context from thread-local storage
 */
const getCurrentContext = (): LoggingContext | undefined => {
  // In a more sophisticated implementation, this would use proper async context
  // For now, we'll use a simple symbol-based approach
  const contextSymbol = Symbol.for('logging-context');
  return contextStore.get(contextSymbol);
};

/**
 * Set the current logging context in thread-local storage
 */
const setCurrentContext = (context: LoggingContext | undefined): void => {
  const contextSymbol = Symbol.for('logging-context');
  if (context) {
    contextStore.set(contextSymbol, context);
  } else {
    contextStore.delete(contextSymbol);
  }
};

/**
 * Extract effect type from effect object for logging
 */
const getEffectType = (eff: Effect<any>): string | undefined => {
  if ('_tag' in eff) {
    return (eff as any)._tag;
  }
  return undefined;
};

/**
 * Format and emit a structured log entry
 */
const emitLog = (entry: StructuredLogEntry): void => {
  const logMessage = JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString()
  });

  // Use existing logger's console output but with structured format
  switch (entry.level) {
    case 'info':
      console.info(logMessage);
      break;
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'debug':
      console.debug(logMessage);
      break;
  }
};

/**
 * Decorator that adds structured logging to any effect
 */
export const withLogging = <T>(operationName: string) => (eff: Effect<T>): Effect<T> => {
  return async (): Promise<T> => {
    // Get or create correlation context
    const currentContext = getCurrentContext();
    const context = currentContext || createLoggingContext(operationName);
    
    // Update operation name if we're creating a new context
    const effectContext = currentContext 
      ? { ...currentContext, operationName }
      : context;

    const startTime = performance.now();
    const effectType = getEffectType(eff);

    // Log effect start
    emitLog({
      level: 'info',
      correlationId: effectContext.correlationId,
      operationName: effectContext.operationName,
      message: 'Effect started',
      timestamp: new Date().toISOString(),
      ...(effectType && { effectType })
    });

    try {
      // Execute effect with correlation context
      setCurrentContext(effectContext);
      const result = await eff();
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      // Log successful completion
      emitLog({
        level: 'info',
        correlationId: effectContext.correlationId,
        operationName: effectContext.operationName,
        message: 'Effect completed',
        timestamp: new Date().toISOString(),
        durationMs,
        result: typeof result === 'object' ? result : result
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);
      const err = error instanceof Error ? error : new Error(String(error));

      // Log failure with error details
      emitLog({
        level: 'error',
        correlationId: effectContext.correlationId,
        operationName: effectContext.operationName,
        message: 'Effect failed',
        timestamp: new Date().toISOString(),
        durationMs,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      });

      throw error;
    } finally {
      // Restore previous context
      setCurrentContext(currentContext);
    }
  };
};

/**
 * Inject a specific correlation context for effect execution
 */
export const withCorrelationId = <T>(context: LoggingContext) => (eff: Effect<T>): Effect<T> => {
  return async (): Promise<T> => {
    const previousContext = getCurrentContext();
    try {
      setCurrentContext(context);
      return await eff();
    } finally {
      setCurrentContext(previousContext);
    }
  };
};

/**
 * Create a logging effect that emits a structured log entry
 */
export const logInfo = (message: string, data?: any): LogEffect => {
  return Object.assign(async (): Promise<void> => {
    const context = getCurrentContext();
    if (context) {
      emitLog({
        level: 'info',
        correlationId: context.correlationId,
        operationName: context.operationName,
        message,
        timestamp: new Date().toISOString(),
        ...(data && { result: data })
      });
    } else {
      // Fallback to regular logger if no context
      logger.info('effect', message, data);
    }
  }, { _tag: 'LogEffect' as const });
};

/**
 * Create a logging effect that emits an error log entry
 */
export const logError = (message: string, error?: Error, data?: any): LogEffect => {
  return Object.assign(async (): Promise<void> => {
    const context = getCurrentContext();
    if (context) {
      emitLog({
        level: 'error',
        correlationId: context.correlationId,
        operationName: context.operationName,
        message,
        timestamp: new Date().toISOString(),
        ...(error && {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        }),
        ...(data && { result: data })
      });
    } else {
      // Fallback to regular logger if no context
      logger.error('effect', message, { error, ...data });
    }
  }, { _tag: 'LogEffect' as const });
};

/**
 * Get the current correlation ID from context
 */
export const getCurrentCorrelationId = (): string | undefined => {
  const context = getCurrentContext();
  return context?.correlationId;
};

/**
 * Check if we're currently in a logging context
 */
export const hasLoggingContext = (): boolean => {
  return getCurrentContext() !== undefined;
};