"use client";

/**
 * Safe Store Access Patterns
 *
 * This file provides utility functions and types for safely accessing the Zustand store.
 * It includes defensive programming patterns to handle undefined state and provide
 * type-safe defaults.
 */

import { useStore } from "../store";
import { StateSlice, RootState } from "../types";

/**
 * Safely select a value from state with a fallback
 *
 * This function provides a type-safe way to access store values with default fallbacks.
 * It handles the case where the state might be undefined and returns the fallback
 * value in that case.
 *
 * @param selector Function that extracts a value from state
 * @param fallback Default value to use if selector returns undefined/null
 * @returns The selected value or fallback if undefined/null
 */
export function useSafeSelector<T, F>(
  selector: (state: RootState) => T | undefined | null,
  fallback: F,
): T | F {
  const value = useStore(selector);
  return value !== undefined && value !== null ? value : fallback;
}

/**
 * Safely select a slice of state
 *
 * This function provides a type-safe way to access a specific state slice.
 * It's a wrapper around useStore that provides better type safety.
 *
 * @param slice The state slice to access
 * @returns The selected slice or undefined if not available
 */
export function useSafeSlice<K extends StateSlice>(
  slice: K,
): RootState[K] | undefined {
  return useStore((state) => state[slice]);
}

/**
 * Safely select an action from a state slice
 *
 * This function provides a type-safe way to access an action from a specific state slice.
 * It handles the case where the slice or action might be undefined and returns
 * a no-op function in that case.
 *
 * @param slice The state slice to access
 * @param actionKey The key of the action within the slice
 * @param fallback Optional custom fallback function to use if the action is undefined
 * @returns The action function or a fallback no-op function
 */
export function useSafeAction<
  K extends StateSlice,
  A extends keyof RootState[K],
  Args extends unknown[],
  ReturnT = unknown,
>(
  slice: K,
  actionKey: A,
  fallback?: (...args: Args) => ReturnT,
): (...args: Args) => ReturnT {
  // Type assertion to handle any return type from the action
  const defaultFallback = (() => {
    console.warn(
      `Action ${String(actionKey)} in slice ${slice} is not available`,
    );
    return undefined;
  }) as (...args: Args) => ReturnT;

  const action = useStore(
    (state) => state[slice]?.[actionKey as keyof RootState[K]],
  );
  // Type assertion to ensure the action has the correct function signature
  return (action as (...args: Args) => ReturnT) || fallback || defaultFallback;
}

/**
 * Create a safe object with multiple selectors and fallbacks
 *
 * This utility function allows creating a safe object with multiple values from the store,
 * each with its own fallback. This is useful for composing multiple safe selectors into
 * a single object to return from a hook.
 *
 * @param selectors Object with selector functions and fallbacks
 * @returns Object with safe values
 *
 * @example
 * const { count, name } = useSafeObject({
 *   count: {
 *     selector: (state) => state[StateSlice.Counter].count,
 *     fallback: 0
 *   },
 *   name: {
 *     selector: (state) => state[StateSlice.User].name,
 *     fallback: "Guest"
 *   }
 * });
 */
/**
 * Type for a selector object with selector function and fallback value
 */
interface SelectorConfig<T, F> {
  selector: (state: RootState) => T | undefined | null;
  fallback: F;
}

/**
 * Create a safe object with multiple selectors and fallbacks
 */
export function useSafeObject<
  T extends Record<string, SelectorConfig<unknown, unknown>>,
>(
  selectors: T,
): {
  [K in keyof T]: T[K] extends SelectorConfig<infer R, infer F> ? R | F : never;
} {
  return Object.keys(selectors).reduce(
    (acc, key) => {
      const { selector, fallback } = selectors[key as keyof T];
      const value = useSafeSelector(selector, fallback);
      return { ...acc, [key]: value };
    },
    {} as {
      [K in keyof T]: T[K] extends SelectorConfig<infer R, infer F>
        ? R | F
        : never;
    },
  );
}

/**
 * Create a type-safe wrapper hook for a specific state slice
 *
 * This function creates a custom hook for a specific state slice with proper typing.
 * It's useful for creating hooks for each slice of the store to enforce type safety.
 *
 * @param slice The state slice to create a hook for
 * @returns A hook function that provides safe access to the slice
 */
export function createSliceHook<K extends StateSlice>(slice: K) {
  return function useSlice(): RootState[K] | undefined {
    return useSafeSlice(slice);
  };
}

/**
 * Type-safe hook factory for creating hooks around store slices
 *
 * This function creates a factory for making hooks that provide type-safe
 * access to state slices with proper fallbacks and defensive programming.
 *
 * @param slice The state slice to create hooks for
 * @returns An object with functions to create hooks for the slice
 */
export function createHooksFactory<K extends StateSlice>(slice: K) {
  return {
    /**
     * Create a selector hook with proper fallback
     *
     * @param selectorFn Function to extract a value from the slice
     * @param defaultValue Default value to use if the selector returns undefined
     * @returns A hook function that returns the selected value or default
     */
    createSelector<T, D>(
      selectorFn: (sliceState: RootState[K]) => T | undefined | null,
      defaultValue: D,
    ) {
      return function useSelector(): T | D {
        return useSafeSelector((state) => {
          const sliceState = state[slice];
          return sliceState ? selectorFn(sliceState) : undefined;
        }, defaultValue);
      };
    },

    /**
     * Create an action hook with proper error handling
     *
     * @param actionKey The key of the action within the slice
     * @param fallbackFn Optional fallback function to use if the action is undefined
     * @returns A hook function that returns the action function or fallback
     */
    createAction<
      A extends keyof RootState[K],
      Args extends unknown[],
      ReturnT = unknown,
    >(actionKey: A, fallbackFn?: (...args: Args) => ReturnT) {
      return function useAction() {
        return useSafeAction<K, A, Args, ReturnT>(slice, actionKey, fallbackFn);
      };
    },
  };
}
