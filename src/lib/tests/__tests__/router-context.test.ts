/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { 
  RouterProvider, 
  useRouter, 
  createRouterWrapper 
} from '../router-context';

describe('Router Context', () => {
  it('should provide default router values', () => {
    const wrapper = createRouterWrapper();
    const { result } = renderHook(() => useRouter(), { wrapper });
    
    expect(result.current).toHaveProperty('pathname', '/');
    expect(result.current).toHaveProperty('push');
    expect(result.current).toHaveProperty('replace');
    expect(typeof result.current.push).toBe('function');
  });
  
  it('should allow customizing router values', () => {
    const customRouter = {
      pathname: '/dashboard',
      params: { id: '123' }
    };
    
    const wrapper = createRouterWrapper(customRouter);
    const { result } = renderHook(() => useRouter(), { wrapper });
    
    expect(result.current.pathname).toBe('/dashboard');
    expect(result.current.params).toEqual({ id: '123' });
  });
  
  it('should track router method calls', () => {
    const wrapper = createRouterWrapper();
    const { result } = renderHook(() => useRouter(), { wrapper });
    
    act(() => {
      result.current.push('/new-page');
    });
    
    expect(result.current.push).toHaveBeenCalledWith('/new-page');
  });
  
  it('should throw error when used outside provider', () => {
    // Silence the expected error in the console during this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      const { result } = renderHook(() => useRouter());
      // Accessing any property will trigger the error
      result.current.pathname;
    }).toThrow('useRouter must be used within a RouterProvider');
    
    // Restore console.error
    consoleError.mockRestore();
  });
  
  it('should support chaining router methods for testing', () => {
    const customRouter = {
      push: jest.fn().mockImplementation(() => ({
        then: jest.fn().mockImplementation((callback) => callback())
      }))
    };
    
    const wrapper = createRouterWrapper(customRouter);
    const { result } = renderHook(() => useRouter(), { wrapper });
    
    // Use a promise-like router.push method
    act(() => {
      result.current.push('/dashboard').then(() => {
        // This would be called when navigation completes
      });
    });
    
    expect(result.current.push).toHaveBeenCalledWith('/dashboard');
  });
});