/**
 * Functional programming utilities for GitPulse
 * Pure functions for composition and data transformation
 */

/**
 * Pipe operator - applies functions left to right
 * pipe(f, g, h)(x) === h(g(f(x)))
 */
export function pipe<A>(value: A): A;
export function pipe<A, B>(value: A, fn1: (a: A) => B): B;
export function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
export function pipe<A, B, C, D>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
export function pipe<A, B, C, D, E>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): E;
export function pipe<A, B, C, D, E, F>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F): F;
export function pipe(value: any, ...fns: Array<(arg: any) => any>): any {
  return fns.reduce((acc, fn) => fn(acc), value);
}

/**
 * Compose operator - applies functions right to left
 * compose(f, g, h)(x) === f(g(h(x)))
 */
export function compose<A, B>(fn1: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => C;
export function compose<A, B, C, D>(fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => D;
export function compose<A, B, C, D, E>(fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => E;
export function compose<A, B, C, D, E, F>(fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => F;
export function compose(...fns: Array<(arg: any) => any>): (value: any) => any {
  return (value: any) => fns.reduceRight((acc, fn) => fn(acc), value);
}

/**
 * Identity function - returns input unchanged
 */
export const identity = <T>(x: T): T => x;

/**
 * Constant function - returns the same value regardless of input
 */
export const constant = <T>(value: T) => () => value;

/**
 * Property accessor - safely get property from object
 */
export const prop = <T, K extends keyof T>(key: K) => (obj: T): T[K] => obj[key];

/**
 * Pick specific properties from an object
 */
export const pick = <T, K extends keyof T>(keys: K[]) => (obj: T): Pick<T, K> =>
  keys.reduce((result, key) => ({ ...result, [key]: obj[key] }), {} as Pick<T, K>);

/**
 * Omit specific properties from an object
 */
export const omit = <T, K extends keyof T>(keys: K[]) => (obj: T): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

/**
 * Group array items by a key function
 */
export const groupBy = <T, K extends string | number>(
  keyFn: (item: T) => K
) => (array: readonly T[]): Record<K, T[]> =>
  array.reduce((groups, item) => {
    const key = keyFn(item);
    return {
      ...groups,
      [key]: [...(groups[key] || []), item]
    };
  }, {} as Record<K, T[]>);

/**
 * Remove duplicates from array based on key function
 */
export const uniqueBy = <T, K>(keyFn: (item: T) => K) => (array: readonly T[]): T[] => {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Sort array by comparator function
 */
export const sortBy = <T>(compareFn: (a: T, b: T) => number) => (array: readonly T[]): T[] =>
  [...array].sort(compareFn);

/**
 * Filter array by predicate
 */
export const filter = <T>(predicate: (item: T) => boolean) => (array: readonly T[]): T[] =>
  array.filter(predicate);

/**
 * Map array with transformation function
 */
export const map = <T, U>(transform: (item: T) => U) => (array: readonly T[]): U[] =>
  array.map(transform);

/**
 * Take first n items from array
 */
export const take = (count: number) => <T>(array: readonly T[]): T[] =>
  array.slice(0, count);

/**
 * Skip first n items from array
 */
export const skip = (count: number) => <T>(array: readonly T[]): T[] =>
  array.slice(count);

/**
 * Partition array into two arrays based on predicate
 */
export const partition = <T>(predicate: (item: T) => boolean) => (array: readonly T[]): [T[], T[]] =>
  array.reduce(
    ([pass, fail], item) => 
      predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]],
    [[], []] as [T[], T[]]
  );

/**
 * Chunk array into smaller arrays of specified size
 */
export const chunk = <T>(size: number) => (array: readonly T[]): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Check if array is empty
 */
export const isEmpty = <T>(array: readonly T[]): boolean => array.length === 0;

/**
 * Check if array is not empty
 */
export const isNotEmpty = <T>(array: readonly T[]): boolean => array.length > 0;