import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const MODULE_NAME = 'api:test-auth:login';

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

/**
 * Interface for customizing the mock user
 */
interface MockUserRequest {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

/**
 * Creates a mock session payload for testing
 */
function createMockSession(customUser?: MockUserRequest): Record<string, any> {
  return {
    user: {
      id: customUser?.userId || 'mock-user-id',
      name: customUser?.userName || 'Mock User',
      email: customUser?.userEmail || 'mock@example.com',
      image: customUser?.userImage || 'https://github.com/ghost.png',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    accessToken: 'mock-github-token',
    installationId: 12345678
  };
}

/**
 * POST handler for mock authentication
 * This endpoint is strictly for E2E testing and is not available in production
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  logger.info(MODULE_NAME, 'Mock authentication endpoint called');
  
  // Security check: Only allow this endpoint in test environments
  if (!isEndpointAllowed(process.env)) {
    logger.warn(MODULE_NAME, 'Unauthorized attempt to access mock auth endpoint', {
      nodeEnv: process.env.NODE_ENV,
      mockAuthEnabled: process.env.E2E_MOCK_AUTH_ENABLED,
      allowedInDev: process.env.ALLOW_E2E_IN_DEV
    });
    
    // Return 404 to hide the existence of this endpoint in production
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }
  
  try {
    // Parse request body for custom user details (if provided)
    let customUser: MockUserRequest | undefined;
    try {
      const body = await request.json();
      customUser = body as MockUserRequest;
    } catch (err) {
      // If body parsing fails, continue with default user
      logger.debug(MODULE_NAME, 'No custom user data provided or invalid JSON', { error: err });
    }
    
    // Create mock session data
    const sessionData = createMockSession(customUser);
    logger.debug(MODULE_NAME, 'Created mock session', {
      userId: sessionData.user.id,
      userName: sessionData.user.name,
      expires: sessionData.expires
    });
    
    // Set the authentication cookie
    const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    
    // Create the response with the cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Mock authentication successful'
      },
      { 
        status: 200,
        headers: {
          'Set-Cookie': `next-auth.session-token=${cookieValue}; HttpOnly; Path=/; SameSite=Lax; ${
            process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
          }Max-Age=86400`
        }
      }
    );
    
    logger.info(MODULE_NAME, 'Mock authentication cookie set successfully');
    return response;
    
  } catch (error) {
    logger.error(MODULE_NAME, 'Error creating mock authentication', { error });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create mock authentication'
      },
      { status: 500 }
    );
  }
}