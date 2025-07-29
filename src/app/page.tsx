'use client';

import { signIn } from "next-auth/react";
import Image from "next/image";
import useProtectedRoute from "@/hooks/useProtectedRoute";
import AuthLoadingScreen from "@/components/ui/AuthLoadingScreen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Home() {
  // Use the protected route hook in reverse - redirect to dashboard if authenticated
  const { isLoading, status } = useProtectedRoute({
    redirectTo: '/dashboard',
    redirectIfFound: true,
    loadingDelay: 250
  });
  
  // Show loading screen when we're redirecting to dashboard
  if (isLoading && status === 'authenticated') {
    return <AuthLoadingScreen 
      message="Authenticated" 
      subMessage="Redirecting to your dashboard..."
    />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 flex flex-col items-center">
        <h1 className="text-5xl font-bold mb-3">
          GitPulse
        </h1>
        <p className="text-muted-foreground">Commit Analysis System</p>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to GitPulse</CardTitle>
          <CardDescription>
            Sign in with GitHub to access your repositories and analyze commits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Messages */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• System ready</p>
            <p>• GitHub commit analysis module initialized</p>
            <p>• Secure sign-in required to access repository data</p>
            {status === 'loading' && (
              <p className="animate-pulse">• Loading authentication status...</p>
            )}
            {status === 'unauthenticated' && (
              <p>• Awaiting authorization...</p>
            )}
          </div>

          {/* Sign In Button */}
          <Button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            disabled={status === 'loading'}
            variant="default"
            size="lg"
            className="w-full"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initializing...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" 
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" 
                    clipRule="evenodd" 
                  />
                </svg>
                Sign in with GitHub
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-1">Secure authentication via GitHub OAuth</p>
        <p className="text-xs text-muted-foreground">No data persistence beyond session scope</p>
      </footer>
    </div>
  );
}