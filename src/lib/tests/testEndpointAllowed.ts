/**
 * A simple implementation of the isEndpointAllowed function for testing
 */

/**
 * Tests if the mock authentication endpoint should be accessible
 * 
 * @param env - Environment variables
 * @returns `true` if the endpoint should be accessible, `false` otherwise
 */
export function testEndpointAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  const isTestEnv = env.NODE_ENV === 'test';
  const isMockAuthEnabled = env.E2E_MOCK_AUTH_ENABLED === 'true';
  const isAllowedInDev = env.ALLOW_E2E_IN_DEV === 'true' && env.NODE_ENV === 'development';
  
  return (isTestEnv && isMockAuthEnabled) || isAllowedInDev;
}