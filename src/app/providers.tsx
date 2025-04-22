"use client";

import { SessionProvider } from "next-auth/react";
import { AuthValidator } from "@/components/AuthValidator";
import { ZustandProvider } from "@/state/ZustandProvider";
import ZustandHydration from "@/components/ZustandHydration";
import InitializationErrorFallback from "@/components/InitializationErrorFallback";
import { useHasMounted } from "@/hooks/useHasMounted";

type Props = {
  children?: React.ReactNode;
};

/**
 * Application Providers Component
 *
 * Wraps the application with all required providers in correct order:
 * 1. SessionProvider for authentication state (highest level)
 * 2. AuthValidator to ensure valid authentication
 * 3. ZustandProvider to ensure store is hydrated before rendering
 *
 * This component ensures that all global application state is properly
 * initialized before rendering child components. It includes guards
 * against server-side rendering of client-only features and provides
 * appropriate loading states and error fallbacks.
 */
function ClientSideProviders({ children }: Props) {
  // Check if we're running on the client
  const hasMounted = useHasMounted();

  // Show minimal loading UI during SSR/initial render
  if (!hasMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse">Loading application...</div>
      </div>
    );
  }

  return (
    <AuthValidator
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="p-4 text-center">
            <div className="animate-pulse mb-4">
              <div
                className="inline-block w-12 h-12 rounded-full"
                style={{ backgroundColor: "rgba(0, 255, 135, 0.2)" }}
              ></div>
            </div>
            <div>Verifying authentication...</div>
          </div>
        </div>
      }
    >
      <ZustandProvider
        loadingIndicator={<ZustandHydration showDetailedProgress={true} />}
        fallback={<InitializationErrorFallback />}
        timeout={10000} // 10s timeout for initialization
      >
        {children}
      </ZustandProvider>
    </AuthValidator>
  );
}

/**
 * Root Providers Component
 *
 * This outer component wraps non-client-specific providers that don't have
 * hydration concerns, such as SessionProvider.
 */
export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ClientSideProviders>{children}</ClientSideProviders>
    </SessionProvider>
  );
}
