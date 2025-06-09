/**
 * Tests for structured logging with effects
 * These tests define the expected behavior for correlation ID propagation and structured logging
 */

import { effect, ioEffect, succeed, fail } from './types';
import { 
  withLogging, 
  createCorrelationId, 
  LoggingContext,
  createLoggingContext,
  withCorrelationId
} from './logging';

describe('Effect Logging System', () => {
  let logOutput: any[] = [];

  beforeEach(() => {
    logOutput = [];
    // Mock console methods to capture log output
    jest.spyOn(console, 'info').mockImplementation((message) => {
      logOutput.push(JSON.parse(message));
    });
    jest.spyOn(console, 'error').mockImplementation((message) => {
      logOutput.push(JSON.parse(message));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createCorrelationId', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = createCorrelationId();
      const id2 = createCorrelationId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });
  });

  describe('createLoggingContext', () => {
    it('should create context with correlation ID and operation name', () => {
      const context = createLoggingContext('test-operation');
      
      expect(context.correlationId).toBeDefined();
      expect(context.operationName).toBe('test-operation');
      expect(context.startTime).toBeInstanceOf(Date);
    });

    it('should accept existing correlation ID', () => {
      const existingId = 'existing-correlation-id';
      const context = createLoggingContext('test-operation', existingId);
      
      expect(context.correlationId).toBe(existingId);
      expect(context.operationName).toBe('test-operation');
    });
  });

  describe('withLogging', () => {
    it('should log effect start and completion with correlation ID', async () => {
      const testEffect = effect(async () => 'test-result');
      const loggedEffect = withLogging('test-operation')(testEffect);
      
      const result = await loggedEffect();
      
      expect(result).toBe('test-result');
      expect(logOutput).toHaveLength(2);
      
      // Start log
      expect(logOutput[0]).toMatchObject({
        level: 'info',
        correlationId: expect.any(String),
        operationName: 'test-operation',
        message: 'Effect started',
        timestamp: expect.any(String)
      });
      
      // Completion log
      expect(logOutput[1]).toMatchObject({
        level: 'info',
        correlationId: logOutput[0].correlationId, // Same correlation ID
        operationName: 'test-operation',
        message: 'Effect completed',
        timestamp: expect.any(String),
        durationMs: expect.any(Number),
        result: 'test-result'
      });
    });

    it('should log effect failure with error details', async () => {
      const testError = new Error('Test error');
      const failingEffect = fail(testError);
      const loggedEffect = withLogging('failing-operation')(failingEffect);
      
      await expect(loggedEffect()).rejects.toThrow('Test error');
      
      expect(logOutput).toHaveLength(2);
      
      // Start log
      expect(logOutput[0]).toMatchObject({
        level: 'info',
        operationName: 'failing-operation',
        message: 'Effect started'
      });
      
      // Error log
      expect(logOutput[1]).toMatchObject({
        level: 'error',
        correlationId: logOutput[0].correlationId,
        operationName: 'failing-operation',
        message: 'Effect failed',
        error: {
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String)
        },
        durationMs: expect.any(Number)
      });
    });

    it('should propagate correlation ID through effect chains', async () => {
      const effect1 = effect(async () => 'step1');
      const effect2 = effect(async () => 'step2');
      
      const loggedEffect1 = withLogging('step-1')(effect1);
      const loggedEffect2 = withLogging('step-2')(effect2);
      
      const context = createLoggingContext('main-operation');
      
      await withCorrelationId(context)(loggedEffect1)();
      await withCorrelationId(context)(loggedEffect2)();
      
      expect(logOutput).toHaveLength(4);
      
      // All logs should have the same correlation ID
      const correlationId = logOutput[0].correlationId;
      expect(logOutput.every(log => log.correlationId === correlationId)).toBe(true);
    });

    it('should include performance metrics in logs', async () => {
      const slowEffect = effect(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'slow-result';
      });
      
      const loggedEffect = withLogging('slow-operation')(slowEffect);
      const startTime = Date.now();
      
      await loggedEffect();
      
      const endTime = Date.now();
      const completionLog = logOutput[1];
      
      expect(completionLog.durationMs).toBeGreaterThan(40);
      expect(completionLog.durationMs).toBeLessThan(endTime - startTime + 10);
    });

    it('should handle IOEffect logging with additional metadata', async () => {
      const ioTestEffect = ioEffect(async () => ({ data: 'io-result' }));
      const loggedEffect = withLogging('io-operation')(ioTestEffect);
      
      await loggedEffect();
      
      expect(logOutput).toHaveLength(2);
      expect(logOutput[0]).toMatchObject({
        operationName: 'io-operation',
        effectType: 'IOEffect',
        message: 'Effect started'
      });
    });
  });

  describe('withCorrelationId', () => {
    it('should inject correlation context into effect execution', async () => {
      const testEffect = withLogging('contextual-operation')(
        effect(async () => 'contextual-result')
      );
      
      const context = createLoggingContext('main-operation', 'custom-correlation-id');
      const contextualEffect = withCorrelationId(context)(testEffect);
      
      await contextualEffect();
      
      expect(logOutput.every(log => log.correlationId === 'custom-correlation-id')).toBe(true);
    });
  });

  describe('Integration with existing logger', () => {
    it('should use existing logger formatting and levels', async () => {
      const testEffect = effect(async () => 'integration-test');
      const loggedEffect = withLogging('integration-operation')(testEffect);
      
      await loggedEffect();
      
      // Should use console.info for structured logging
      expect(console.info).toHaveBeenCalledTimes(2);
      
      // Logs should be JSON formatted
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      expect(() => JSON.parse(logCall)).not.toThrow();
    });
  });
});