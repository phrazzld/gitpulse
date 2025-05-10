/**
 * Network Testing Utilities
 *
 * This module provides utilities for mocking network requests in tests.
 * It includes functions for mocking fetch calls and common API patterns.
 */

import { jest } from '@jest/globals';

/**
 * Type definitions for mock API responses
 */
export type MockApiResponse<T> = {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
};

/**
 * Sets up global fetch mocks for testing
 * @returns Utility functions for controlling fetch behavior
 */
export function setupFetchMocks() {
  // Store original fetch
  const originalFetch = global.fetch;

  // Clear any existing mocks
  if (jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockClear();
  } else {
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve(new Response())
    );
  }

  /**
   * Helper to create a mock response
   */
  const createResponse = <T>(mockResponse: Partial<MockApiResponse<T>> = {}): Response => {
    const {
      ok = true,
      status = 200,
      statusText = 'OK',
      data = {} as T,
      headers = {}
    } = mockResponse;

    const responseHeaders = new Headers();
    Object.entries(headers).forEach(([key, value]) => {
      responseHeaders.append(key, value);
    });

    // Create mock functions for response methods
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    const json = jest.fn().mockResolvedValue(data);
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    const text = jest.fn().mockResolvedValue(JSON.stringify(data));
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    const blob = jest.fn().mockResolvedValue(new Blob([JSON.stringify(data)]));
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    const arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(0));
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    const formData = jest.fn().mockResolvedValue(new FormData());

    // Create a partial Response object with common properties
    const responseInit = {
      status,
      statusText,
      headers: responseHeaders
    };

    // Use the Response constructor for most properties
    const response = new Response(JSON.stringify(data), responseInit);
    
    // Override methods with mocks for better testing control
    Object.defineProperties(response, {
      ok: { value: ok },
      json: { value: json },
      text: { value: text },
      blob: { value: blob },
      arrayBuffer: { value: arrayBuffer },
      formData: { value: formData }
    });
    
    return response;
  };

  /**
   * Creates a standard success response
   */
  const mockSuccess = <T>(data: T, statusCode = 200, headers = {}): void => {
    const mockResponse = createResponse({
      ok: true,
      status: statusCode,
      data,
      headers
    });
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
  };

  /**
   * Creates a standard error response
   */
  const mockError = <T>(
    data: T,
    statusCode = 500,
    statusText = 'Internal Server Error',
    headers = {}
  ): void => {
    const mockResponse = createResponse({
      ok: false,
      status: statusCode,
      statusText,
      data,
      headers
    });
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
  };

  /**
   * Creates a network error response
   */
  const mockNetworkError = (errorMessage = 'Network error'): void => {
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
  };

  /**
   * Mocks multiple fetch calls in sequence
   */
  const mockMultiple = (responses: Array<Partial<MockApiResponse<any>> | Error>): void => {
    responses.forEach(response => {
      if (response instanceof Error) {
        mockNetworkError(response.message);
      } else {
        const mockResponse = createResponse(response);
        // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      }
    });
  };

  /**
   * Asserts that fetch was called with the expected URL and options
   */
  const expectFetchCalls = (calls: Array<[string | URL | Request, RequestInit?]>): void => {
    expect(global.fetch).toHaveBeenCalledTimes(calls.length);
    
    calls.forEach((call, index) => {
      const [url, options] = call;
      const fetchCall = (global.fetch as jest.Mock).mock.calls[index];
      
      // Check URL
      const fetchUrl = fetchCall[0];
      const expectedUrl = url instanceof Request ? url.url : url.toString();
      
      // Apply type guard for fetch URL
      if (typeof fetchUrl === 'object' && fetchUrl !== null && 'url' in fetchUrl) {
        expect((fetchUrl as Request).url).toBe(expectedUrl);
      } else {
        expect(String(fetchUrl)).toBe(expectedUrl);
      }
      
      // Check options if provided
      if (options) {
        expect(fetchCall[1]).toMatchObject(options);
      }
    });
  };

  return {
    mockSuccess,
    mockError,
    mockNetworkError,
    mockMultiple,
    expectFetchCalls,
    reset: () => {
      (global.fetch as jest.Mock).mockClear();
    },
    restore: () => {
      global.fetch = originalFetch;
    }
  };
}

/**
 * Utility to wait for a specific amount of time
 * Useful for testing debounce and throttle functions
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};