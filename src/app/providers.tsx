'use client';

import { SessionProvider } from "next-auth/react";
import { AuthValidator } from "@/components/AuthValidator";
import { ThemeProvider } from "@/components/theme-provider";

type Props = {
  children?: React.ReactNode;
};

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="system">
        <AuthValidator fallback={<div className="flex justify-center items-center h-screen">Verifying authentication...</div>}>
          {children}
        </AuthValidator>
      </ThemeProvider>
    </SessionProvider>
  );
}