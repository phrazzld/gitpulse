/**
 * Effect type system for GitPulse
 * Separates pure computation from side effects
 */

/**
 * Base Effect type - represents a suspended computation that can be executed
 */
export type Effect<T> = () => Promise<T>;

/**
 * IO Effect - specifically for I/O operations (database, API calls, file system)
 */
export type IOEffect<T> = Effect<T> & { readonly _tag: 'IOEffect' };

/**
 * Log Effect - for logging operations
 */
export type LogEffect = Effect<void> & { readonly _tag: 'LogEffect' };

/**
 * Time Effect - for time-related operations
 */
export type TimeEffect<T> = Effect<T> & { readonly _tag: 'TimeEffect' };

/**
 * Create a basic effect
 */
export const effect = <T>(fn: () => Promise<T>): Effect<T> => fn;

/**
 * Create an IO effect
 */
export const ioEffect = <T>(fn: () => Promise<T>): IOEffect<T> => 
  Object.assign(fn, { _tag: 'IOEffect' as const });

/**
 * Create a logging effect
 */
export const logEffect = (fn: () => Promise<void>): LogEffect =>
  Object.assign(fn, { _tag: 'LogEffect' as const });

/**
 * Create a time effect
 */
export const timeEffect = <T>(fn: () => Promise<T>): TimeEffect<T> =>
  Object.assign(fn, { _tag: 'TimeEffect' as const });

/**
 * Create an effect that always succeeds with a value
 */
export const succeed = <T>(value: T): Effect<T> =>
  effect(async () => value);

/**
 * Create an effect that always fails with an error
 */
export const fail = (error: Error): Effect<never> =>
  effect(async () => { throw error; });

/**
 * Map over the result of an effect
 */
export const mapEffect = <T, U>(fn: (value: T) => U) => (eff: Effect<T>): Effect<U> =>
  effect(async () => {
    const result = await eff();
    return fn(result);
  });

/**
 * Chain effects together
 */
export const flatMapEffect = <T, U>(fn: (value: T) => Effect<U>) => (eff: Effect<T>): Effect<U> =>
  effect(async () => {
    const result = await eff();
    const nextEffect = fn(result);
    return await nextEffect();
  });

/**
 * Run effects in parallel and collect results
 */
export const parallel = <T>(effects: Effect<T>[]): Effect<T[]> =>
  effect(async () => {
    const promises = effects.map(eff => eff());
    return await Promise.all(promises);
  });

/**
 * Run effects in sequence and collect results
 */
export const sequence = <T>(effects: Effect<T>[]): Effect<T[]> =>
  effect(async () => {
    const results: T[] = [];
    for (const eff of effects) {
      const result = await eff();
      results.push(result);
    }
    return results;
  });

/**
 * Add timeout to an effect
 */
export const withTimeout = <T>(timeoutMs: number) => (eff: Effect<T>): Effect<T> =>
  effect(async () => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Effect timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    
    return await Promise.race([eff(), timeoutPromise]);
  });

/**
 * Add retry logic to an effect
 */
export const withRetry = <T>(maxAttempts: number, delayMs: number = 1000) => (eff: Effect<T>): Effect<T> =>
  effect(async () => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await eff();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    
    throw lastError!;
  });

/**
 * Catch errors in an effect and recover
 */
export const catchEffect = <T>(recovery: (error: Error) => T) => (eff: Effect<T>): Effect<T> =>
  effect(async () => {
    try {
      return await eff();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return recovery(err);
    }
  });

/**
 * Execute side effect without changing the result
 */
export const tap = <T>(sideEffect: (value: T) => Effect<void>) => (eff: Effect<T>): Effect<T> =>
  effect(async () => {
    const result = await eff();
    await sideEffect(result)();
    return result;
  });

/**
 * Combine two effects, keeping only the result of the second
 */
export const zipRight = <A, B>(first: Effect<A>) => (second: Effect<B>): Effect<B> =>
  effect(async () => {
    await first();
    return await second();
  });

/**
 * Combine two effects, keeping only the result of the first
 */
export const zipLeft = <A, B>(first: Effect<A>) => (second: Effect<B>): Effect<A> =>
  effect(async () => {
    const result = await first();
    await second();
    return result;
  });