/**
 * Result type for explicit error handling without exceptions
 * Replaces try-catch with functional error handling patterns
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Create a success result
 */
export const success = <T>(data: T): Success<T> => ({ 
  success: true, 
  data 
});

/**
 * Create a failure result
 */
export const failure = <E>(error: E): Failure<E> => ({ 
  success: false, 
  error 
});

/**
 * Transform the data in a success result, or pass through failure
 */
export const map = <T, U, E>(fn: (value: T) => U) => (result: Result<T, E>): Result<U, E> =>
  result.success ? success(fn(result.data)) : result;

/**
 * Chain results - if success, apply function that returns another Result
 */
export const flatMap = <T, U, E>(fn: (value: T) => Result<U, E>) => (result: Result<T, E>): Result<U, E> =>
  result.success ? fn(result.data) : result;

/**
 * Transform the error in a failure result, or pass through success
 */
export const mapError = <T, E, F>(fn: (error: E) => F) => (result: Result<T, E>): Result<T, F> =>
  result.success ? result : failure(fn(result.error));

/**
 * Get the data or return a default value
 */
export const getOrElse = <T>(defaultValue: T) => <E>(result: Result<T, E>): T =>
  result.success ? result.data : defaultValue;

/**
 * Get the data or return result of calling function
 */
export const getOrElseWith = <T>(fn: () => T) => <E>(result: Result<T, E>): T =>
  result.success ? result.data : fn();

/**
 * Fold a result into a single value by handling both success and failure cases
 */
export const fold = <T, E, U>(
  onSuccess: (data: T) => U,
  onFailure: (error: E) => U
) => (result: Result<T, E>): U =>
  result.success ? onSuccess(result.data) : onFailure(result.error);

/**
 * Check if result is success
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result.success;

/**
 * Check if result is failure
 */
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  !result.success;

/**
 * Convert a promise to a Result, catching any errors
 */
export const fromPromise = async <T>(promise: Promise<T>): Promise<Result<T, Error>> => {
  try {
    const data = await promise;
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Convert a throwing function to one that returns a Result
 */
export const tryCatch = <T extends unknown[], R>(
  fn: (...args: T) => R
) => (...args: T): Result<R, Error> => {
  try {
    return success(fn(...args));
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Convert an async throwing function to one that returns a Result promise
 */
export const tryCatchAsync = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
) => async (...args: T): Promise<Result<R, Error>> => {
  try {
    const result = await fn(...args);
    return success(result);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Combine multiple results - succeeds only if all succeed
 */
export const combine = <T extends readonly unknown[]>(
  ...results: { [K in keyof T]: Result<T[K], Error> }
): Result<T, Error> => {
  const errors: Error[] = [];
  const data: unknown[] = [];
  
  for (const result of results) {
    if (result.success) {
      data.push(result.data);
    } else {
      errors.push(result.error);
    }
  }
  
  if (errors.length > 0) {
    const combinedMessage = errors.map(e => e.message).join('; ');
    return failure(new Error(combinedMessage));
  }
  
  return success(data as unknown as T);
};

/**
 * Apply a function if the result is success, otherwise return the failure
 */
export const tap = <T, E>(fn: (value: T) => void) => (result: Result<T, E>): Result<T, E> => {
  if (result.success) {
    fn(result.data);
  }
  return result;
};

/**
 * Apply a function if the result is failure, otherwise return the success
 */
export const tapError = <T, E>(fn: (error: E) => void) => (result: Result<T, E>): Result<T, E> => {
  if (!result.success) {
    fn(result.error);
  }
  return result;
};