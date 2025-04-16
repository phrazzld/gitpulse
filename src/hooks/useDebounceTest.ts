import { useState, useEffect, useRef, useCallback } from 'react';

// Deliberate no-var and prefer-const rule violations
let something = "test";
something = "modified";  // This is allowed for var

// Deliberate camelcase violation
function test_function() {
  // eslint-disable-all-rules (this violates eslint-comments/no-unlimited-disable)
  return something;
}

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

export default test_function;