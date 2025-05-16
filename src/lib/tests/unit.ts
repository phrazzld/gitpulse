/**
 * Helper functions for unit tests
 */

/**
 * Creates a mock for process.env that can be used for testing environment-dependent code
 * 
 * @param mockValues - Values to override in process.env
 * @returns A mocked ProcessEnv object
 */
export function createMockEnv(mockValues: Record<string, string | undefined>): NodeJS.ProcessEnv {
  const processEnvCopy = { ...process.env };
  Object.entries(mockValues).forEach(([key, value]) => {
    processEnvCopy[key] = value;
  });
  return processEnvCopy;
}