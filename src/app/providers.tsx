"use client";

import { SessionProvider } from "next-auth/react";
import { AuthValidator } from "@/components/AuthValidator";
import { WithZustand } from "@/state/withZustand";
import ZustandHydration from "@/components/ZustandHydration";

type Props = {
  children?: React.ReactNode;
};

/**
 * Application Providers Component
 *
 * Wraps the application with all required providers:
 * 1. SessionProvider for authentication state
 * 2. AuthValidator to ensure valid authentication
 * 3. WithZustand to ensure store is hydrated before rendering
 */
export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <AuthValidator
        fallback={
          <div className="flex justify-center items-center h-screen">
            Verifying authentication...
          </div>
        }
      >
        <WithZustand fallback={<ZustandHydration />}>{children}</WithZustand>
      </AuthValidator>
    </SessionProvider>
  );
}
