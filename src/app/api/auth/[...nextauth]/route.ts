import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { createAuthOptions } from "@/lib/auth/authConfig";

const MODULE_NAME = "api:auth";

// Check and handle GitHub App installation flow
function isGitHubAppInstallationCallback(req: NextRequest) {
  // Get the installation_id and setup_action from the request
  const url = new URL(req.url);
  const installationId = url.searchParams.get('installation_id');
  const setupAction = url.searchParams.get('setup_action');
  
  return installationId && setupAction === 'install';
}

// Use the configuration from our shared config file
const authOptions = createAuthOptions();

// Create a function to check for GitHub App installation callbacks
async function handleRequest(req: NextRequest) {
  // Check if this is a GitHub App installation callback
  if (isGitHubAppInstallationCallback(req)) {
    logger.info(MODULE_NAME, "Intercepted GitHub App installation callback");
    
    // Get the installation_id from the URL
    const url = new URL(req.url);
    const installationId = url.searchParams.get('installation_id');
    
    // Redirect to our setup route with the installation_id
    const redirectUrl = new URL('/api/github/setup', req.url);
    redirectUrl.searchParams.set('installation_id', installationId as string);
    
    logger.debug(MODULE_NAME, "Redirecting to setup route", { redirectUrl: redirectUrl.toString() });
    
    return Response.redirect(redirectUrl.toString());
  }
  
  // If not an installation callback, continue with NextAuth
  return null;
}

// Create the NextAuth handler with a wrapper for our custom logic
const handler = async (req: NextRequest, ...rest: any[]) => {
  // First check if it's an installation callback
  const redirectResponse = await handleRequest(req);
  if (redirectResponse) {
    return redirectResponse;
  }
  
  // Otherwise, use NextAuth's handler
  const nextAuthHandler = NextAuth(authOptions);
  return nextAuthHandler(req, ...rest);
};

export { handler as GET, handler as POST };