import {
  Effect,
  IOEffect,
  LogEffect,
  TimeEffect,
  effect,
  ioEffect,
  logEffect,
  timeEffect,
  succeed,
  fail,
  mapEffect,
  flatMapEffect,
  parallel,
  sequence,
  withTimeout,
  withRetry,
  catchEffect,
  tap,
  zipRight,
  zipLeft
} from './types';

describe('Effect Type System', () => {
  describe('Basic Effect Construction', () => {
    it('should create basic effect that defers execution', () => {
      let executed = false;
      const eff = effect(async () => {
        executed = true;
        return 42;
      });

      // Effect is created but not executed
      expect(executed).toBe(false);
      expect(typeof eff).toBe('function');
    });

    it('should execute effect when called', async () => {
      let executed = false;
      const eff = effect(async () => {
        executed = true;
        return 42;
      });

      const result = await eff();
      expect(executed).toBe(true);
      expect(result).toBe(42);
    });

    it('should create IOEffect with proper tag', () => {
      const eff = ioEffect(async () => 'io-result');
      
      expect(eff._tag).toBe('IOEffect');
      expect(typeof eff).toBe('function');
    });

    it('should create LogEffect with proper tag', () => {
      const eff = logEffect(async () => {
        console.log('test log');
      });
      
      expect(eff._tag).toBe('LogEffect');
      expect(typeof eff).toBe('function');
    });

    it('should create TimeEffect with proper tag', () => {
      const eff = timeEffect(async () => Date.now());
      
      expect(eff._tag).toBe('TimeEffect');
      expect(typeof eff).toBe('function');
    });

    it('should differentiate effect types at runtime', () => {
      const basicEff = effect(async () => 'basic');
      const ioEff = ioEffect(async () => 'io');
      const logEff = logEffect(async () => {});
      const timeEff = timeEffect(async () => Date.now());

      expect('_tag' in basicEff).toBe(false);
      expect(ioEff._tag).toBe('IOEffect');
      expect(logEff._tag).toBe('LogEffect');
      expect(timeEff._tag).toBe('TimeEffect');
    });
  });

  describe('Effect Constructors', () => {
    it('should create successful effect with succeed', async () => {
      const eff = succeed(42);
      const result = await eff();
      
      expect(result).toBe(42);
    });

    it('should create failing effect with fail', async () => {
      const error = new Error('test error');
      const eff = fail(error);
      
      await expect(eff()).rejects.toThrow('test error');
    });

    it('should handle different data types', async () => {
      const stringEff = succeed('hello');
      const objectEff = succeed({ name: 'John', age: 30 });
      const arrayEff = succeed([1, 2, 3]);
      const nullEff = succeed(null);

      expect(await stringEff()).toBe('hello');
      expect(await objectEff()).toEqual({ name: 'John', age: 30 });
      expect(await arrayEff()).toEqual([1, 2, 3]);
      expect(await nullEff()).toBe(null);
    });
  });

  describe('Effect Transformations', () => {
    describe('mapEffect', () => {
      it('should transform effect result', async () => {
        const eff = succeed(5);
        const doubled = mapEffect((x: number) => x * 2)(eff);
        
        const result = await doubled();
        expect(result).toBe(10);
      });

      it('should handle type transformations', async () => {
        const eff = succeed(123);
        const stringified = mapEffect((x: number) => x.toString())(eff);
        
        const result = await stringified();
        expect(result).toBe('123');
      });

      it('should propagate errors', async () => {
        const error = new Error('original error');
        const eff = fail(error);
        const mapped = mapEffect((x: never) => x)(eff);
        
        await expect(mapped()).rejects.toThrow('original error');
      });

      it('should compose multiple transformations', async () => {
        const eff = succeed(5);
        const transformed = mapEffect((x: number) => x * 2)(
          mapEffect((x: number) => x + 1)(eff)
        );
        
        const result = await transformed();
        expect(result).toBe(12); // (5 + 1) * 2
      });
    });

    describe('flatMapEffect', () => {
      it('should chain effects', async () => {
        const divide = (a: number, b: number): Effect<number> =>
          b === 0 ? fail(new Error('Division by zero')) : succeed(a / b);

        const eff = succeed(10);
        const chained = flatMapEffect((x: number) => divide(x, 2))(eff);
        
        const result = await chained();
        expect(result).toBe(5);
      });

      it('should short-circuit on failure', async () => {
        const divide = (a: number, b: number): Effect<number> =>
          b === 0 ? fail(new Error('Division by zero')) : succeed(a / b);

        const eff = succeed(10);
        const chained = flatMapEffect((x: number) => divide(x, 0))(eff);
        
        await expect(chained()).rejects.toThrow('Division by zero');
      });

      it('should propagate initial failures', async () => {
        const error = new Error('initial error');
        const eff = fail(error);
        const chained = flatMapEffect((x: never) => succeed(x))(eff);
        
        await expect(chained()).rejects.toThrow('initial error');
      });

      it('should compose multiple operations', async () => {
        const add = (x: number) => (y: number): Effect<number> => succeed(x + y);
        const multiply = (x: number) => (y: number): Effect<number> => succeed(x * y);

        const eff = succeed(5);
        const composed = flatMapEffect(add(3))(
          flatMapEffect(multiply(2))(eff)
        );
        
        const result = await composed();
        expect(result).toBe(13); // (5 * 2) + 3
      });
    });
  });

  describe('Effect Combinators', () => {
    describe('parallel', () => {
      it('should run effects in parallel', async () => {
        const timestamps: number[] = [];
        
        const eff1 = effect(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          timestamps.push(Date.now());
          return 'first';
        });
        
        const eff2 = effect(async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          timestamps.push(Date.now());
          return 'second';
        });
        
        const combined = parallel([eff1, eff2]);
        const results = await combined();
        
        expect(results).toEqual(['first', 'second']);
        // Second should complete before first (shorter delay)
        expect(timestamps.length).toBe(2);
        expect(timestamps[0]).toBeLessThanOrEqual(timestamps[1]);
      });

      it('should handle empty array', async () => {
        const combined = parallel([]);
        const results = await combined();
        
        expect(results).toEqual([]);
      });

      it('should fail if any effect fails', async () => {
        const eff1 = succeed('success');
        const eff2 = fail(new Error('parallel error'));
        
        const combined = parallel([eff1, eff2]);
        
        await expect(combined()).rejects.toThrow('parallel error');
      });
    });

    describe('sequence', () => {
      it('should run effects in sequence', async () => {
        const timestamps: number[] = [];
        
        const eff1 = effect(async () => {
          timestamps.push(Date.now());
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'first';
        });
        
        const eff2 = effect(async () => {
          timestamps.push(Date.now());
          await new Promise(resolve => setTimeout(resolve, 30));
          return 'second';
        });
        
        const combined = sequence([eff1, eff2]);
        const results = await combined();
        
        expect(results).toEqual(['first', 'second']);
        // First should start before second
        expect(timestamps.length).toBe(2);
        expect(timestamps[0]).toBeLessThan(timestamps[1]);
      });

      it('should handle empty array', async () => {
        const combined = sequence([]);
        const results = await combined();
        
        expect(results).toEqual([]);
      });

      it('should stop on first failure', async () => {
        let secondExecuted = false;
        
        const eff1 = fail(new Error('sequence error'));
        const eff2 = effect(async () => {
          secondExecuted = true;
          return 'second';
        });
        
        const combined = sequence([eff1, eff2]);
        
        await expect(combined()).rejects.toThrow('sequence error');
        expect(secondExecuted).toBe(false);
      });
    });
  });

  describe('Effect Utilities', () => {
    describe('withTimeout', () => {
      it('should complete fast effects within timeout', async () => {
        const eff = effect(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'completed';
        });
        
        const timedEff = withTimeout(100)(eff);
        const result = await timedEff();
        
        expect(result).toBe('completed');
      });

      it('should timeout slow effects', async () => {
        const eff = effect(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return 'should not complete';
        });
        
        const timedEff = withTimeout(50)(eff);
        
        await expect(timedEff()).rejects.toThrow('Effect timed out after 50ms');
      });
    });

    describe('withRetry', () => {
      it('should succeed on first attempt if no error', async () => {
        let attempts = 0;
        const eff = effect(async () => {
          attempts++;
          return 'success';
        });
        
        const retryEff = withRetry(3, 10)(eff);
        const result = await retryEff();
        
        expect(result).toBe('success');
        expect(attempts).toBe(1);
      });

      it('should retry on failure and eventually succeed', async () => {
        let attempts = 0;
        const eff = effect(async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('temporary error');
          }
          return 'success';
        });
        
        const retryEff = withRetry(3, 10)(eff);
        const result = await retryEff();
        
        expect(result).toBe('success');
        expect(attempts).toBe(3);
      });

      it('should fail after max attempts', async () => {
        let attempts = 0;
        const eff = effect(async () => {
          attempts++;
          throw new Error('persistent error');
        });
        
        const retryEff = withRetry(2, 10)(eff);
        
        await expect(retryEff()).rejects.toThrow('persistent error');
        expect(attempts).toBe(2);
      });
    });

    describe('catchEffect', () => {
      it('should pass through successful effects', async () => {
        const eff = succeed(42);
        const caught = catchEffect((error: Error) => -1)(eff);
        
        const result = await caught();
        expect(result).toBe(42);
      });

      it('should recover from errors', async () => {
        const eff = fail(new Error('test error'));
        const caught = catchEffect((error: Error) => `Recovered: ${error.message}`)(eff);
        
        const result = await caught();
        expect(result).toBe('Recovered: test error');
      });

      it('should handle non-Error exceptions', async () => {
        const eff = effect(async () => {
          throw 'string error';
        });
        const caught = catchEffect((error: Error) => `Caught: ${error.message}`)(eff);
        
        const result = await caught();
        expect(result).toBe('Caught: string error');
      });
    });

    describe('tap', () => {
      it('should execute side effect without changing result', async () => {
        let sideEffectCalled = false;
        let sideEffectValue: number | undefined;
        
        const sideEffect = (value: number) => effect(async () => {
          sideEffectCalled = true;
          sideEffectValue = value;
        });
        
        const eff = succeed(42);
        const tapped = tap(sideEffect)(eff);
        
        const result = await tapped();
        
        expect(result).toBe(42);
        expect(sideEffectCalled).toBe(true);
        expect(sideEffectValue).toBe(42);
      });

      it('should not execute side effect on error', async () => {
        let sideEffectCalled = false;
        
        const sideEffect = (value: never) => effect(async () => {
          sideEffectCalled = true;
        });
        
        const eff = fail(new Error('test error'));
        const tapped = tap(sideEffect)(eff);
        
        await expect(tapped()).rejects.toThrow('test error');
        expect(sideEffectCalled).toBe(false);
      });
    });

    describe('zipRight and zipLeft', () => {
      it('should keep result of second effect with zipRight', async () => {
        const eff1 = succeed(1);
        const eff2 = succeed('second');
        
        const zipped = zipRight(eff1)(eff2);
        const result = await zipped();
        
        expect(result).toBe('second');
      });

      it('should keep result of first effect with zipLeft', async () => {
        const eff1 = succeed(1);
        const eff2 = succeed('second');
        
        const zipped = zipLeft(eff1)(eff2);
        const result = await zipped();
        
        expect(result).toBe(1);
      });

      it('should fail if either effect fails', async () => {
        const eff1 = succeed(1);
        const eff2 = fail(new Error('second fails'));
        
        const zippedRight = zipRight(eff1)(eff2);
        const zippedLeft = zipLeft(eff1)(eff2);
        
        await expect(zippedRight()).rejects.toThrow('second fails');
        await expect(zippedLeft()).rejects.toThrow('second fails');
      });
    });
  });

  describe('Complex Compositions', () => {
    it('should compose effects in complex workflows', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const validateEmail = (email: string): Effect<string> =>
        email.includes('@') ? succeed(email) : fail(new Error('Invalid email'));

      const createUser = (name: string, email: string): Effect<User> =>
        succeed({ id: Math.floor(Math.random() * 1000), name, email });

      const saveUser = (user: User): IOEffect<User> =>
        ioEffect(async () => {
          // Simulate database save
          await new Promise(resolve => setTimeout(resolve, 10));
          return user;
        });

      const processUserCreation = (name: string, email: string): IOEffect<User> =>
        flatMapEffect((validEmail: string) =>
          flatMapEffect((user: User) =>
            saveUser(user)
          )(createUser(name, validEmail))
        )(validateEmail(email)) as IOEffect<User>;

      const result = await processUserCreation('John', 'john@example.com')();
      
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(typeof result.id).toBe('number');
    });

    it('should maintain deferred execution through complex transformations', async () => {
      let executionOrder: string[] = [];
      
      const step1 = effect(async () => {
        executionOrder.push('step1');
        return 1;
      });
      
      const step2 = (x: number) => effect(async () => {
        executionOrder.push('step2');
        return x + 1;
      });
      
      const step3 = (x: number) => effect(async () => {
        executionOrder.push('step3');
        return x * 2;
      });
      
      // Create the composition but don't execute
      const composed = flatMapEffect(step3)(flatMapEffect(step2)(step1));
      
      // Nothing should have executed yet
      expect(executionOrder).toEqual([]);
      
      // Execute the composition
      const result = await composed();
      
      expect(result).toBe(4); // ((1 + 1) * 2)
      expect(executionOrder).toEqual(['step1', 'step2', 'step3']);
    });

    it('should handle error propagation in complex chains', async () => {
      const step1 = succeed(1);
      const step2 = (x: number) => fail(new Error('Step 2 failed'));
      const step3 = (x: number) => succeed(x * 3);
      
      const composed = flatMapEffect(step3)(flatMapEffect(step2)(step1));
      
      await expect(composed()).rejects.toThrow('Step 2 failed');
    });
  });

  describe('Type Safety and Runtime Discrimination', () => {
    it('should maintain type safety through transformations', () => {
      const stringEffect: Effect<string> = succeed('hello');
      const numberEffect: Effect<number> = mapEffect((s: string) => s.length)(stringEffect);
      const booleanEffect: Effect<boolean> = mapEffect((n: number) => n > 0)(numberEffect);
      
      // TypeScript should verify these types at compile time
      expect(typeof stringEffect).toBe('function');
      expect(typeof numberEffect).toBe('function');
      expect(typeof booleanEffect).toBe('function');
    });

    it('should enable runtime effect type discrimination', () => {
      const basicEff = effect(async () => 'basic');
      const ioEff = ioEffect(async () => 'io');
      const logEff = logEffect(async () => {});
      
      const getEffectType = (eff: Effect<any>): string => {
        if ('_tag' in eff) {
          return (eff as any)._tag;
        }
        return 'basic';
      };
      
      expect(getEffectType(basicEff)).toBe('basic');
      expect(getEffectType(ioEff)).toBe('IOEffect');
      expect(getEffectType(logEff)).toBe('LogEffect');
    });
  });
});