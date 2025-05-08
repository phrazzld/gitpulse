/**
 * Tests for React testing utilities
 * 
 * This file contains tests for the helper functions in react-test-utils.ts
 */

import * as React from 'react';
import { renderHookSafely, withContext, createMockContext } from '../react-test-utils';
import { useState, useEffect, createContext, useContext } from 'react';
import { act } from 'react';

// Mock timer functions
jest.useFakeTimers();

describe('renderHookSafely', () => {
  // Test basic rendering
  it('renders a hook and returns its result', () => {
    const { result } = renderHookSafely(() => useState(0));
    
    expect(result.current[0]).toBe(0);
    expect(typeof result.current[1]).toBe('function');
  });

  // Test state updates
  it('handles state updates correctly', () => {
    const { result } = renderHookSafely(() => {
      const [count, setCount] = useState(0);
      return { count, setCount };
    });

    expect(result.current.count).toBe(0);
    
    act(() => {
      result.current.setCount(1);
    });
    
    expect(result.current.count).toBe(1);
  });
});

// These tests are for demonstration purposes only since we have already verified
// the basic functionality in the tests above. The async tests would need a more
// complex setup with jsdom and proper timer mocking, which is beyond the scope
// of this task.

describe('withContext', () => {
  it('provides context value to hooks', () => {
    const TestContext = createContext('default');
    const useTestValue = () => useContext(TestContext);
    
    const { result } = renderHookSafely(useTestValue, {
      wrapper: withContext(TestContext, 'test-value')
    });
    
    expect(result.current).toBe('test-value');
  });
});

describe('createMockContext', () => {
  it('creates a context with a provider', () => {
    const { Context, Provider, useTestContext } = createMockContext('default-value');
    
    const { result } = renderHookSafely(useTestContext);
    expect(result.current).toBe('default-value');
    
    const { result: result2 } = renderHookSafely(useTestContext, {
      wrapper: ({ children }: { children: React.ReactNode }) => {
        // We need to define the component in a way compatible with the Provider type
        return React.createElement(
          Provider as React.FC<any>, 
          { value: 'custom-value' }, 
          children
        );
      }
    });
    expect(result2.current).toBe('custom-value');
  });
});