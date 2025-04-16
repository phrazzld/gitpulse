import { useState, useEffect, useRef, useCallback } from 'react';

// Debounce hook for values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes or unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Type for a generic callback function
 * This is a more type-safe approach than the previous pattern
 */
export type CallbackFunction<TArgs = unknown, TReturn = void> = 
  (arg: TArgs) => TReturn;

// Type for the debounced callback hook result
interface DebounceCallbackResult<T> {
  callback: T;
  pending: boolean;
  flush: () => void;
  cancel: () => void;
}

// Debounce hook for callbacks that take a single argument
export function useDebounceCallback<T extends (arg: A) => R, A = unknown, R = void>(
  callback: T,
  delay: number
): DebounceCallbackResult<T> {
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);
  const lastArgRef = useRef<A | null>(null);

  // Update the callback ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear any pending timeouts when unmounting
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // The debounced callback
  const debouncedCallback = useCallback((arg: A) => {
    lastArgRef.current = arg;
    setPending(true);

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      if (lastArgRef.current !== null) {
        callbackRef.current(lastArgRef.current);
      }
      timeoutRef.current = null;
      setPending(false);
    }, delay);
  }, [delay]) as T; // Safe cast since we're preserving the original interface

  // Function to immediately execute the callback with the last arg
  const flush = useCallback(() => {
    if (timeoutRef.current && lastArgRef.current !== null) {
      clearTimeout(timeoutRef.current);
      callbackRef.current(lastArgRef.current);
      timeoutRef.current = null;
      setPending(false);
    }
  }, []);

  // Function to cancel the debounced callback
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setPending(false);
    }
  }, []);

  return {
    callback: debouncedCallback,
    pending,
    flush,
    cancel,
  };
}