import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";
import { ChevronDown } from "lucide-react";

/**
 * Props for the UserProfileSection component
 */
export interface UserProfileSectionProps {
  /**
   * User session information from NextAuth
   * When provided, user account UI with profile picture (if available) will be shown
   * When not provided or null, login button will be shown instead
   */
  session?: Session | null;
}

/**
 * UserProfileSection component
 *
 * Displays either the signed-in user profile or a sign-in button based on authentication state
 */
export const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  session,
}) => {
  return (
    <div className="ml-auto flex items-center gap-2 md:gap-4">
      {session ? (
        <div className="flex items-center gap-2">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              className="rounded-full w-8 h-8 border border-muted shadow-sm"
              aria-hidden="true"
            />
          )}
          <span className="text-sm font-medium hidden sm:inline-block">
            {session.user?.name || "User"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Account menu"
            className="ml-1"
          >
            <span className="sr-only">Account menu</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Link href="/api/auth/signin" className="no-underline">
          <Button variant="default" size="sm">
            Sign In
          </Button>
        </Link>
      )}
    </div>
  );
};

export default UserProfileSection;
