import type { NextAuthOptions, Session } from "next-auth";
import GitHubProvider from "next-auth/providers/github"; 
import { logger } from "@/lib/logger";
import { checkAppInstallation } from "@/lib/github/auth";

// Add type for JWT token
interface ExtendedToken {
  accessToken?: string;
  installationId?: number;
  [key: string]: any;
}

// Add type for Extended Session
interface ExtendedSession extends Session {
  accessToken?: string;
  installationId?: number;
}

const MODULE_NAME = "auth:config";

// A helper function to generate consistent callback URL
function getCallbackUrl() {
  // In production, use NEXTAUTH_URL if available
  const baseUrl = process.env.NEXTAUTH_URL;
  if (baseUrl) {
    return `${baseUrl}/api/auth/callback/github`;
  }
  
  // For development, let NextAuth handle the callback URL automatically
  // It will use the Host header from the request which includes the correct port
  return undefined;
}

export const createAuthOptions = (): NextAuthOptions => ({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "repo read:user read:org user:email", // Comprehensive scopes for full repository access
        },
        url: "https://github.com/login/oauth/authorize",
      },
      // Only set callback URL if explicitly defined
      ...(getCallbackUrl() ? { 
        // @ts-ignore - callbackUrl is not in the type but it works
        callbackUrl: getCallbackUrl() 
      } : {})
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }: { token: ExtendedToken; account: any | null; user: any | undefined }) {
      logger.debug(MODULE_NAME, "JWT callback called", { 
        hasToken: !!token,
        hasAccount: !!account,
        hasUser: !!user
      });
      
      if (account) {
        logger.info(MODULE_NAME, "Adding access token to JWT", { 
          provider: account.provider,
          tokenType: account.type,
          // Do not log actual token values
          hasAccessToken: !!account.access_token
        });
        
        token.accessToken = account.access_token;
        
        // Check for GitHub App installation when we first get an access token
        try {
          if (account.access_token) {
            const installationId = await checkAppInstallation(account.access_token);
            if (installationId) {
              logger.info(MODULE_NAME, "Found GitHub App installation during auth", { installationId });
              token.installationId = installationId;
            } else {
              logger.info(MODULE_NAME, "No GitHub App installation found during auth");
            }
          }
        } catch (error) {
          logger.warn(MODULE_NAME, "Error checking for GitHub App installation during auth", { error });
        }
      }
      
      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: ExtendedToken; user: any }) {
      logger.debug(MODULE_NAME, "Session callback called", { 
        hasSession: !!session, 
        hasToken: !!token,
        hasAccessToken: !!token.accessToken,
        hasInstallationId: !!token.installationId
      });
      
      // Add token and installation ID to the session
      session.accessToken = token.accessToken;
      
      if (token.installationId) {
        session.installationId = token.installationId;
        logger.debug(MODULE_NAME, "Added installation ID to session", { installationId: token.installationId });
      }
      
      logger.info(MODULE_NAME, "Session created/updated", {
        user: session.user?.email || session.user?.name || 'unknown',
        hasInstallationId: !!session.installationId
      });
      
      return session;
    },
    async signIn({ user, account, profile }: { user: any; account: any | null; profile?: any }) {
      if (!account) return false;
      
      logger.info(MODULE_NAME, "User sign in", {
        provider: account.provider,
        userId: user.id,
        userName: user.name || 'unknown'
      });
      
      return true;
    },
  },
  events: {
    async signIn(message: { user: any }) {
      logger.info(MODULE_NAME, "User signed in successfully", {
        user: message.user.email || message.user.name || 'unknown'
      });
    },
    async signOut(message: { token: ExtendedToken }) {
      logger.info(MODULE_NAME, "User signed out", {
        user: message.token.email || message.token.name || 'unknown'
      });
    }
  },
  // Override NextAuth's logger with our own implementation in events
  logger: undefined,
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  
  // Properly handle the callback URL problems
  pages: {
    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',
    error: '/api/auth/error',
    verifyRequest: '/api/auth/verify-request',
  },
  
  // Add debug mode for development
  debug: process.env.NODE_ENV !== 'production'
});