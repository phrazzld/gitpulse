/**
 * Type Definitions for Network Test Utilities
 *
 * This file defines TypeScript interfaces for network testing utilities
 * to provide proper typing for test mocks.
 */

/**
 * Interface for mock API responses
 */
export interface MockApiResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

/**
 * Type for fetch mock implementation
 */
export type FetchMockImplementation = (
  input: RequestInfo | URL, 
  init?: RequestInit
) => Promise<Response>;

/**
 * Interface for fetch mock utilities
 */
export interface FetchMockUtils {
  /**
   * Creates a standard success response
   */
  mockSuccess: <T>(data: T, statusCode?: number, headers?: Record<string, string>) => void;
  
  /**
   * Creates a standard error response
   */
  mockError: <T>(
    data: T,
    statusCode?: number,
    statusText?: string,
    headers?: Record<string, string>
  ) => void;
  
  /**
   * Creates a network error response
   */
  mockNetworkError: (errorMessage?: string) => void;
  
  /**
   * Mocks multiple fetch calls in sequence
   */
  mockMultiple: (responses: Array<Partial<MockApiResponse<any>> | Error>) => void;
  
  /**
   * Asserts that fetch was called with the expected URL and options
   */
  expectFetchCalls: (calls: Array<[string | URL | Request, RequestInit?]>) => void;
  
  /**
   * Clears the mock implementation
   */
  reset: () => void;
  
  /**
   * Restores the original fetch implementation
   */
  restore: () => void;
}