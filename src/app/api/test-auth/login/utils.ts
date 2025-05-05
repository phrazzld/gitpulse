/**
 * Validates if the mock authentication endpoint should be accessible
 * Only available in test environments or explicitly allowed in development
 * 
 * @param env - Environment variables to use for validation (for testing)
 */
export function isEndpointAllowed(env = process.env): boolean {
  const isTestEnv = env.NODE_ENV === 'test';
  const isMockAuthEnabled = env.E2E_MOCK_AUTH_ENABLED === 'true';
  const isAllowedInDev = env.ALLOW_E2E_IN_DEV === 'true' && env.NODE_ENV === 'development';
  
  return (isTestEnv && isMockAuthEnabled) || isAllowedInDev;
}